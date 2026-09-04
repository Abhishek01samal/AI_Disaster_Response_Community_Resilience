import { inngest } from "../lib/inngest.js";
import { runEmergencyResponseAgent } from "../agents/response-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { ResponseInput } from "../agents/schemas.js";

/**
 * 7. Emergency Response Agent (deterministic)
 * Nearest-available-responder dispatch and ETA math. No LLM — dispatch of a
 * physical responder is life-critical and must be fully deterministic.
 * `simulated: true` always stays visible in the output.
 */
export const responseFunction = inngest.createFunction(
  {
    id: "agent-response",
    triggers: [{ event: "resq/agent.response.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, input } = event.data as {
      workflowId: string;
      input: ResponseInput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "RESPONSE",
      input,
      reviewRequired: (output) => output.status === "RESPONDER_REQUESTED",
      run: () =>
        step.run("dispatch-nearest-responder", () =>
          runEmergencyResponseAgent(input)
        ),
    });
  }
);
