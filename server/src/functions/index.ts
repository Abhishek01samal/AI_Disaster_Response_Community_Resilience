import { dataRefinementFunction } from "./data-refinement.function.js";
import { validationFunction } from "./validation.function.js";
import { riskFunction } from "./risk.function.js";
import { routeFunction } from "./route.function.js";
import { resourceFunction } from "./resource.function.js";
import { responseFunction } from "./response.function.js";
import { evaluationFunction } from "./evaluation.function.js";
import { disasterResponseOrchestrator } from "./disaster-orchestration.function.js";

/**
 * Every registered Inngest function for the ResQ agent system:
 *
 *   disasterResponseOrchestrator  — Master Agent: full flood-report pipeline
 *   sosResponseOrchestrator       — time-critical SOS -> Response Agent path
 *   dataRefinementFunction        — 1. Data Refinement Agent   (AI)
 *   validationFunction            — 2. Validation Agent        (deterministic)
 *   riskFunction                  — 4. Risk Intelligence Agent (AI)
 *   routeFunction                 — 5. Safe Route & Location   (deterministic)
 *   resourceFunction              — 6. Resource & Relief Agent (deterministic + AI narrative)
 *   responseFunction              — 7. Emergency Response      (deterministic)
 *   evaluationFunction            — 8. Evaluation Agent        (deterministic)
 */
export const resqAgentFunctions = [
  disasterResponseOrchestrator,
  dataRefinementFunction,
  validationFunction,
  riskFunction,
  routeFunction,
  resourceFunction,
  responseFunction,
  evaluationFunction,
];
