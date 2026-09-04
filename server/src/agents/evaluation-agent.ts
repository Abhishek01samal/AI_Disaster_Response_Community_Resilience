import {
  evaluationOutputSchema,
  type EvaluationOutput,
  type RiskOutput,
  type RouteOutput,
  type ResourceOutput,
  type ResponseOutput,
  type ValidationOutput,
} from "./schemas.js";

export interface EvaluationInput {
  workflowId: string;
  validation: ValidationOutput;
  risk: RiskOutput | null;
  route: RouteOutput | null;
  resource: ResourceOutput | null;
  response: ResponseOutput | null;
  officialAlertActive: boolean;
  dataFreshnessSeconds: number;
}

const MAX_FRESHNESS_SECONDS = 15 * 60; // 15 minutes
const MIN_CONFIDENCE = 0.5;

/**
 * Agent boundary: Evaluation is the final, deterministic safety gate before
 * anything is surfaced as "approved". It never uses an LLM to decide
 * approval — a self-referential model judging its own upstream AI outputs
 * would defeat the point of a gate. This is the concrete expression of
 * "Verified sources establish authority. Humans approve high-impact actions."
 */
export function runEvaluationAgent(input: EvaluationInput): EvaluationOutput {
  const { validation, risk, route, resource, response } = input;

  const evidenceSupported = Boolean(
    risk && risk.reasons.length > 0 && (risk.duplicateCluster === null || risk.duplicateCluster.similarReports >= 0)
  );

  const sourceVerified = input.officialAlertActive || validation.checks.sourceValid;

  const confidenceAcceptable =
    validation.confidence >= MIN_CONFIDENCE &&
    (risk ? risk.confidence >= MIN_CONFIDENCE : true) &&
    (route ? route.confidence >= MIN_CONFIDENCE : true);

  const dataFresh = input.dataFreshnessSeconds <= MAX_FRESHNESS_SECONDS;

  const agentOutputsConsistent = checkConsistency(risk, route);

  const safetyPolicyPassed =
    validation.validationStatus !== "INVALID" &&
    (!response || response.simulated === true);

  const explainabilityPresent = Boolean(
    (risk?.reasons?.length ?? 0) > 0 || (route?.rankedLocations?.length ?? 0) > 0
  );

  const checks = {
    evidenceSupported,
    sourceVerified,
    confidenceAcceptable,
    dataFresh,
    agentOutputsConsistent,
    safetyPolicyPassed,
    explainabilityPresent,
  };

  const reviewReasons: string[] = [];
  const approvedOutputs: string[] = [];
  const blockedOutputs: string[] = [];

  if (!safetyPolicyPassed) {
    reviewReasons.push("Validation flagged this event as INVALID.");
  }
  if (!agentOutputsConsistent) {
    reviewReasons.push("Risk and route agent outputs are inconsistent with each other.");
  }
  if (!dataFresh) {
    reviewReasons.push("Underlying data is stale.");
  }
  if (!confidenceAcceptable) {
    reviewReasons.push("One or more agent confidence scores are below the acceptance threshold.");
  }
  if (validation.requiresHumanReview) {
    reviewReasons.push("Validation Agent flagged this event for human review.");
  }
  if (resource && resource.requiresHumanConfirmation) {
    reviewReasons.push("Resource allocation requires human confirmation.");
  }
  if (response?.status === "RESPONDER_REQUESTED") {
    reviewReasons.push("A simulated responder dispatch requires human confirmation before real-world action.");
  }

  let evaluationStatus: EvaluationOutput["evaluationStatus"];
  if (!safetyPolicyPassed) {
    evaluationStatus = "BLOCKED";
    blockedOutputs.push("RISK_ASSESSMENT", "SAFE_LOCATION_RECOMMENDATION", "RESOURCE_MATCHING", "RESPONSE_DISPATCH");
  } else if (reviewReasons.length > 0) {
    evaluationStatus = "APPROVED_WITH_REVIEW";
    if (risk) approvedOutputs.push("RISK_ASSESSMENT");
    if (route) approvedOutputs.push("SAFE_LOCATION_RECOMMENDATION");
  } else {
    evaluationStatus = "APPROVED";
    if (risk) approvedOutputs.push("RISK_ASSESSMENT");
    if (route) approvedOutputs.push("SAFE_LOCATION_RECOMMENDATION");
    if (resource) approvedOutputs.push("RESOURCE_MATCHING");
    if (response) approvedOutputs.push("RESPONSE_DISPATCH");
  }

  const humanReviewRequired = evaluationStatus !== "APPROVED";

  const output: EvaluationOutput = {
    workflowId: input.workflowId,
    evaluationStatus,
    checks,
    humanReviewRequired,
    reviewReasons,
    approvedOutputs,
    blockedOutputs,
    timestamp: new Date().toISOString(),
  };

  return evaluationOutputSchema.parse(output);
}

function checkConsistency(risk: RiskOutput | null, route: RouteOutput | null): boolean {
  if (!risk || !route) return true;
  // A CRITICAL/HIGH risk with no viable recommended location at all is a
  // red flag worth a human's attention rather than silent auto-approval.
  if ((risk.riskLevel === "HIGH" || risk.riskLevel === "CRITICAL") && !route.recommendedLocation) {
    return false;
  }
  return true;
}