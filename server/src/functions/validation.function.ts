import { inngest } from "../lib/inngest.js";
import { runValidationAgent } from "../agents/validation-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { RefinementOutput } from "../agents/schemas.js";

/**
 * 2. Validation Agent (deterministic)
 * Rule-based gate: schema, location bounds, timestamp sanity, source
 * legitimacy, rate limiting, duplicate detection. No LLM — see
 * agents/validation.agent.ts for why.
 */
export const validationFunction = inngest.createFunction(
  {
    id: "agent-validation",
    triggers: [{ event: "resq/agent.validation.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, refinedEvent } = event.data as {
      workflowId: string;
      refinedEvent: RefinementOutput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "VALIDATION",
      input: refinedEvent,
      confidenceOf: (output) => output.confidence,
      reviewRequired: (output) => output.requiresHumanReview,
      run: () =>
        step.run("run-validation-checks", () =>
          runValidationAgent(refinedEvent)
        ),
    });
  }
);
