import { randomUUID } from "crypto";
import { inngest } from "../lib/inngest.js";
import { prisma } from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { dataRefinementFunction } from "./data-refinement.function.js";
import { validationFunction } from "./validation.function.js";
import { riskFunction } from "./risk.function.js";
import { routeFunction } from "./route.function.js";
import { resourceFunction } from "./resource.function.js";
import { responseFunction } from "./response.function.js";
import { evaluationFunction } from "./evaluation.function.js";
import type {
  RefinementOutput,
  ValidationOutput,
  RiskOutput,
  RouteOutput,
  ResourceOutput,
  ResponseOutput,
  OrchestratorOutput,
} from "../agents/schemas.js";
import type { EvaluationInput } from "../agents/evaluation-agent.js";

/**
 * 3. Master / Orchestrator Agent (deterministic)
 *
 * This is the top-level Inngest function for the full disaster-response
 * pipeline described in section 9 of the reference doc:
 *
 *   Data Refinement -> Validation -> Master -> [Risk, Route, Resource,
 *   Response] (parallel) -> Evaluation
 *
 * The Master coordinates workflow execution only. It does not
 * independently issue evacuation orders or autonomous dispatch decisions —
 * those stay inside each specialized agent's own deterministic/AI-signal
 * boundary, and nothing is "final" until the Evaluation Agent's gate runs.
 */
export const disasterResponseOrchestrator = inngest.createFunction(
  {
    id: "resq-disaster-response-orchestrator",
    triggers: [{ event: "resq/report.received" }],
  },
  async ({ event, step }) => {
    const rawInput = event.data;

    // ---- Step 0: create the workflow record -------------------------------
    const workflow: { id: string; eventId?: string | null } = await step.run(
      "create-agent-workflow",
      () =>
        prisma.agentWorkflow.create({
          data: {
            workflowType: "DISASTER_RESPONSE",
            status: "RUNNING",
            userId: rawInput.userId ?? null,
            input: rawInput as any,
            startedAt: new Date(),
          },
        })
    );

    // ---- Step 1: Data Refinement Agent (AI) --------------------------------
    const refinedEvent: RefinementOutput = await step.invoke(
      "run-data-refinement",
      {
        function: dataRefinementFunction,
        data: { workflowId: workflow.id, input: rawInput },
      }
    );

    await step.run("attach-event-id-to-workflow", () =>
      prisma.agentWorkflow.update({
        where: { id: workflow.id },
        data: { eventId: refinedEvent.eventId },
      })
    );

    // ---- Step 2: Validation Agent (deterministic) --------------------------
    const validation: ValidationOutput = await step.invoke("run-validation", {
      function: validationFunction,
      data: { workflowId: workflow.id, refinedEvent },
    });

    if (validation.validationStatus === "INVALID") {
      await step.run("block-workflow-on-invalid-event", () =>
        prisma.agentWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: "BLOCKED",
            completedAt: new Date(),
            output: {
              reason: "Validation Agent rejected the event.",
              validation,
            } as any,
          },
        })
      );

      await step.sendEvent("emit-workflow-blocked", {
        name: "resq/workflow.completed",
        data: {
          workflowId: workflow.id,
          eventId: refinedEvent.eventId,
          evaluationStatus: "BLOCKED",
        },
      });

      return { workflowId: workflow.id, status: "BLOCKED", validation };
    }

    // ---- Step 3: Master builds & records the task plan (deterministic) ----
    const orchestratorOutput: OrchestratorOutput = await recordAgentExecution({
      workflowId: workflow.id,
      agentType: "MASTER",
      input: {
        eventId: refinedEvent.eventId,
        validationStatus: validation.validationStatus,
      },
      run: async () =>
        step.run(
          "build-task-plan",
          () =>
            ({
              workflowId: workflow.id,
              eventId: refinedEvent.eventId,
              status: "STARTED",
              tasks: [
                {
                  agent: "RISK",
                  taskId: `task-risk-${workflow.id}`,
                  status: "QUEUED",
                },
                {
                  agent: "ROUTE",
                  taskId: `task-route-${workflow.id}`,
                  status: "QUEUED",
                },
                {
                  agent: "RESOURCE",
                  taskId: `task-resource-${workflow.id}`,
                  status: "QUEUED",
                },
                {
                  agent: "RESPONSE",
                  taskId: `task-response-${workflow.id}`,
                  status: "QUEUED",
                },
              ],
            }) as OrchestratorOutput
        ),
    });

    // ---- Gather context each downstream agent needs from the database -----
    const context: {
      alerts: any[];
      shelters: any[];
      needs: any[];
      offers: any[];
      ambulances: any[];
    } = await step.run("gather-downstream-context", async () => {
      const [alerts, shelters, needs, offers, ambulances] = await Promise.all([
        prisma.alert.findMany({
          where: {
            isActive: true,
            hazardType: mapEventTypeToHazard(refinedEvent.eventType) as any,
          },
          take: 10,
          orderBy: { issuedAt: "desc" },
        }),
        prisma.shelter.findMany({
          where: { status: "OPEN" },
          include: { location: true },
          take: 20,
        }),
        prisma.reliefNeed.findMany({
          where: { status: { in: ["OPEN", "PARTIALLY_FILLED"] } },
          take: 25,
        }),
        prisma.resourceOffer.findMany({
          where: { status: "AVAILABLE" },
          take: 25,
        }),
        prisma.ambulance.findMany({
          where: { status: "AVAILABLE" },
          take: 10,
        }),
      ]);

      return { alerts, shelters, needs, offers, ambulances };
    });

    // ---- Step 4: fan out to Risk, Route, Resource, Response (parallel) -----
    const riskInputPayload = {
      eventId: refinedEvent.eventId,
      hazardType: refinedEvent.eventType,
      location: refinedEvent.location,
      reports: [
        {
          reportId: `report-${refinedEvent.eventId}`,
          text: refinedEvent.normalizedText,
          source: refinedEvent.source.type,
          timestamp: refinedEvent.timestamp,
        },
      ],
      officialAlerts: context.alerts.map((a: any) => ({
        alertId: a.id,
        severity: a.severity,
        source: "OFFICIAL",
        timestamp: a.issuedAt.toISOString(),
      })),
    };

    const routeInputPayload: any = {
      eventId: refinedEvent.eventId,
      user: {
        location: refinedEvent.location,
        peopleCount: 1,
        accessibilityRequired: false,
      },
      // Populated with a conservative default; replaced below once risk resolves.
      risk: {
        riskLevel: "MEDIUM",
        hazardType: refinedEvent.eventType as string,
        affectedZones: [] as string[],
      },
      safeLocations: context.shelters.map((s: any) => ({
        locationId: s.id,
        name: s.name,
        capacity: s.capacity,
        occupied: s.occupied,
        officiallyDesignated: s.officiallyDesignated,
        accessibility: s.accessibility,
        lat: s.location?.latitude,
        lng: s.location?.longitude,
      })),
      roadClosures: [] as { roadId: string; status: string; reason: string }[],
    };

    const resourceInputPayload = {
      eventId: refinedEvent.eventId,
      needs: context.needs.map((n: any) => ({
        needId: n.id,
        type: n.type,
        quantity: n.quantity,
        unit: n.unit,
        locationId: n.shelterId ?? undefined,
      })),
      offers: context.offers.map((o: any) => ({
        offerId: o.id,
        type: o.type,
        quantity: o.quantity,
        unit: o.unit,
        provider: o.description ?? "Unnamed provider",
        locationId: o.locationId ?? undefined,
      })),
      camps: context.shelters.map((s: any) => ({
        campId: s.id,
        name: s.name,
        capacity: s.capacity,
        occupied: s.occupied,
      })),
    };

    const syntheticSos = buildSyntheticSosIfNeeded(
      refinedEvent,
      rawInput.userId
    );

    const responseInputPayload = {
      eventId: refinedEvent.eventId,
      sosRequest: syntheticSos,
      availableResponders: context.ambulances.map((a: any) => ({
        responderId: a.id,
        type: "AMBULANCE",
        status: a.status,
        distanceKm:
          a.latitude != null && a.longitude != null
            ? haversineDistanceKm(refinedEvent.location, {
                lat: a.latitude,
                lng: a.longitude,
              })
            : 999,
      })),
    };

    // Risk resolves first so Route can weigh affected zones/riskLevel; the
    // rest run in parallel since they don't depend on each other.
    const risk: RiskOutput = await step.invoke("run-risk", {
      function: riskFunction,
      data: { workflowId: workflow.id, input: riskInputPayload },
    });

    routeInputPayload.risk = {
      riskLevel: risk.riskLevel,
      hazardType: risk.hazardType,
      affectedZones: risk.affectedZones,
    };

    const [route, resource, response]: [
      RouteOutput,
      ResourceOutput,
      ResponseOutput,
    ] = await Promise.all([
      step.invoke("run-route", {
        function: routeFunction,
        data: { workflowId: workflow.id, input: routeInputPayload },
      }),
      step.invoke("run-resource", {
        function: resourceFunction,
        data: { workflowId: workflow.id, input: resourceInputPayload },
      }),
      step.invoke("run-response", {
        function: responseFunction,
        data: { workflowId: workflow.id, input: responseInputPayload },
      }),
    ]);

    // ---- Persist an Incident record now that Risk has resolved ------------
    await step.run("persist-incident", () =>
      prisma.incident.create({
        data: {
          title: `${refinedEvent.eventType} — ${refinedEvent.location.name ?? "Unknown location"}`,
          description: refinedEvent.normalizedText,
          incidentType: refinedEvent.eventType as any,
          severity: mapRiskLevelToSeverity(risk.riskLevel) as any,
          priority: mapPriorityScoreToPriority(risk.priorityScore) as any,
          sourceState: "AI_SIGNAL",
          verification: "UNVERIFIED",
          confidence: risk.confidence,
          reportedAt: new Date(refinedEvent.timestamp),
          metadata: {
            workflowId: workflow.id,
            evidence: refinedEvent.evidence,
          } as any,
        },
      })
    );

    // ---- Step 5: Evaluation Agent (deterministic gate) ---------------------
    const evaluationInput: EvaluationInput = {
      workflowId: workflow.id,
      validation,
      risk,
      route,
      resource,
      response,
      officialAlertActive: context.alerts.length > 0,
      dataFreshnessSeconds: Math.max(
        0,
        Math.round((Date.now() - Date.parse(refinedEvent.timestamp)) / 1000)
      ),
    };

    const evaluation = await step.invoke("run-evaluation", {
      function: evaluationFunction,
      data: evaluationInput,
    });

    // ---- Finalize the workflow ---------------------------------------------
    const finalStatus =
      evaluation.evaluationStatus === "BLOCKED"
        ? "BLOCKED"
        : evaluation.evaluationStatus === "APPROVED_WITH_REVIEW"
          ? "REVIEW_REQUIRED"
          : "COMPLETED";

    await step.run("finalize-workflow", () =>
      prisma.agentWorkflow.update({
        where: { id: workflow.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          output: {
            orchestratorOutput,
            risk,
            route,
            resource,
            response,
            evaluation,
          } as any,
        },
      })
    );

    await step.sendEvent("emit-workflow-completed", {
      name: "resq/workflow.completed",
      data: {
        workflowId: workflow.id,
        eventId: refinedEvent.eventId,
        evaluationStatus: evaluation.evaluationStatus,
      },
    });

    logger.info(
      `Disaster response workflow ${workflow.id} finished as ${finalStatus}`
    );

    return {
      workflowId: workflow.id,
      eventId: refinedEvent.eventId,
      status: finalStatus,
      refinedEvent,
      validation,
      risk,
      route,
      resource,
      response,
      evaluation,
    };
  }
);

function mapEventTypeToHazard(eventType: string): string {
  const map: Record<string, string> = {
    FLOOD_REPORT: "FLOOD",
    LANDSLIDE: "LANDSLIDE",
    FIRE: "FIRE",
    STRUCTURAL_DANGER: "EARTHQUAKE",
  };
  return map[eventType] ?? "OTHER";
}

function mapRiskLevelToSeverity(riskLevel: string): string {
  const map: Record<string, string> = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
  };
  return map[riskLevel] ?? "MEDIUM";
}

function mapPriorityScoreToPriority(score: number): string {
  if (score >= 80) return "P0";
  if (score >= 55) return "P1";
  if (score >= 30) return "P2";
  return "P3";
}

function buildSyntheticSosIfNeeded(
  refinedEvent: RefinementOutput,
  userId?: string
) {
  const needsResponder =
    refinedEvent.eventType === "MEDICAL" ||
    refinedEvent.eventType === "TRAPPED";
  if (!needsResponder) return null;

  return {
    sosId: `sos-${randomUUID().slice(0, 8)}`,
    userId: userId ?? refinedEvent.source.sourceId,
    emergencyType: refinedEvent.eventType,
    peopleAffected: 1,
    trapped: refinedEvent.eventType === "TRAPPED",
    medicalHelpRequired: refinedEvent.eventType === "MEDICAL",
    locationConsent: true,
    location: refinedEvent.location,
    timestamp: refinedEvent.timestamp,
  };
}
