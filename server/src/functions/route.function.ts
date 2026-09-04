import { inngest } from "../lib/inngest.js";
import { runSafeRouteAgent } from "../agents/route-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { RouteInput } from "../agents/schemas.js";

/**
 * 5. Safe Route & Location Agent (deterministic)
 * Ranks shelters and computes a recommended route. Suitability
 * recommendation, not a safety guarantee — see agents/route.agent.ts.
 */
export const routeFunction = inngest.createFunction(
  {
    id: "agent-route",
    triggers: [{ event: "resq/agent.route.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, input } = event.data as {
      workflowId: string;
      input: RouteInput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "ROUTE",
      input,
      confidenceOf: (output) => output.confidence,
      run: () => step.run("compute-safe-route", () => runSafeRouteAgent(input)),
    });
  }
);
