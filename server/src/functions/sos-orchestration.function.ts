import { inngest } from "../lib/inngest.js";
import { prisma } from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import { runEmergencyResponseAgent } from "../agents/response-agent.js";
import { haversineDistanceKm } from "../utils/geo.js";
import { toIncidentType } from "../utils/incident-type.js";
import type { ResponseInput, ResponseOutput } from "../agents/schemas.js";

/**
 * Time-critical SOS path: persist the request, run the deterministic
 * Response Agent (simulated ambulance matching), then leave the case
 * in a human-visible queue. No LLM. No autonomous dispatch.
 */
export const sosResponseOrchestrator = inngest.createFunction(
  {
    id: "resq-sos-response-orchestrator",
    triggers: [{ event: "resq/sos.requested" }],
  },
  async ({ event, step }) => {
    const { sosRequest, userId } = event.data as {
      sosRequest: {
        sosId: string;
        userId: string;
        emergencyType: string;
        peopleAffected: number;
        trapped: boolean;
        medicalHelpRequired: boolean;
        locationConsent: boolean;
        location: { lat: number; lng: number };
        timestamp: string;
        emergencyNote?: string;
      };
      userId: string;
    };

    const workflow = (await step.run("create-sos-workflow", () =>
      prisma.agentWorkflow.create({
        data: {
          workflowType: "SOS_RESPONSE",
          status: "RUNNING",
          userId: userId ?? sosRequest.userId,
          eventId: sosRequest.sosId,
          input: sosRequest as any,
          startedAt: new Date(),
        },
      })
    )) as { id: string };

    const persisted = (await step.run("persist-sos-request", async () => {
      try {
        const row = await prisma.sOSRequest.create({
          data: {
            id: sosRequest.sosId,
            userId: sosRequest.userId,
            emergencyType: toIncidentType(sosRequest.emergencyType) as any,
            peopleAffected: sosRequest.peopleAffected,
            trapped: sosRequest.trapped,
            medicalHelpRequired: sosRequest.medicalHelpRequired,
            locationShared: sosRequest.locationConsent,
            latitude: sosRequest.location.lat,
            longitude: sosRequest.location.lng,
            emergencyNote: sosRequest.emergencyNote ?? null,
            status: "ACTIVE",
            priority: derivePriority(sosRequest),
          },
        });
        return { id: row.id, priority: row.priority, stored: true };
      } catch (err) {
        logger.warn(`SOS persist skipped: ${(err as Error).message}`);
        return {
          id: sosRequest.sosId,
          priority: derivePriority(sosRequest),
          stored: false,
        };
      }
    })) as { id: string; priority: string; stored: boolean };

    const ambulances = (await step.run("load-available-ambulances", async () => {
      try {
        return await prisma.ambulance.findMany({
          where: { status: "AVAILABLE" },
          take: 10,
        });
      } catch {
        return [];
      }
    })) as {
      id: string;
      status: string;
      latitude: number | null;
      longitude: number | null;
    }[];

    const responseInput: ResponseInput = {
      eventId: sosRequest.sosId,
      sosRequest: {
        sosId: sosRequest.sosId,
        userId: sosRequest.userId,
        emergencyType: sosRequest.emergencyType,
        peopleAffected: sosRequest.peopleAffected,
        trapped: sosRequest.trapped,
        medicalHelpRequired: sosRequest.medicalHelpRequired,
        locationConsent: sosRequest.locationConsent,
        location: sosRequest.location,
        timestamp: sosRequest.timestamp,
      },
      availableResponders: ambulances.map((a) => ({
        responderId: a.id,
        type: "AMBULANCE",
        status: a.status,
        distanceKm:
          a.latitude != null && a.longitude != null
            ? haversineDistanceKm(sosRequest.location, {
                lat: a.latitude,
                lng: a.longitude,
              })
            : 999,
      })),
    };

    const response: ResponseOutput = await recordAgentExecution({
      workflowId: workflow.id,
      agentType: "RESPONSE",
      input: responseInput,
      reviewRequired: (output) => output.status === "RESPONDER_REQUESTED",
      run: () =>
        step.run("run-response-agent", () =>
          runEmergencyResponseAgent(responseInput)
        ),
    });

    await step.run("apply-simulated-assignment", async () => {
      if (!persisted.stored) return;

      const nextStatus =
        response.status === "RESPONDER_REQUESTED"
          ? "RESPONDER_REQUESTED"
          : "ACKNOWLEDGED";

      await prisma.sOSRequest.update({
        where: { id: persisted.id },
        data: { status: nextStatus as any },
      });

      if (response.responder?.responderId) {
        try {
          await prisma.ambulanceAssignment.create({
            data: {
              ambulanceId: response.responder.responderId,
              sosRequestId: persisted.id,
              status: "REQUESTED",
              etaMinutes: response.etaMinutes ?? null,
            },
          });
          await prisma.ambulance.update({
            where: { id: response.responder.responderId },
            data: { status: "BUSY" },
          });
        } catch (err) {
          logger.warn(`Ambulance assignment skipped: ${(err as Error).message}`);
        }
      }
    });

    await step.run("finalize-sos-workflow", () =>
      prisma.agentWorkflow.update({
        where: { id: workflow.id },
        data: {
          status: "REVIEW_REQUIRED",
          completedAt: new Date(),
          output: { response, simulated: true } as any,
        },
      })
    );

    logger.info(
      `SOS ${sosRequest.sosId} processed as ${response.status} (simulated)`
    );

    return {
      workflowId: workflow.id,
      sosId: sosRequest.sosId,
      priority: persisted.priority,
      response,
    };
  }
);

function derivePriority(sos: {
  trapped: boolean;
  medicalHelpRequired: boolean;
  peopleAffected: number;
}): "P0" | "P1" | "P2" | "P3" {
  if (sos.trapped || sos.medicalHelpRequired) return "P0";
  if (sos.peopleAffected >= 8) return "P1";
  if (sos.peopleAffected >= 3) return "P2";
  return "P3";
}
