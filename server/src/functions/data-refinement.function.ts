import { inngest } from "../lib/inngest.js";
import { runDataRefinementAgent } from "../agents/refinement-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { RefinementInput } from "../agents/schemas.js";

/**
 * 1. Data Refinement Agent (AI-backed)
 * Structures and normalizes a raw report. Does not declare truth or make
 * emergency decisions — see agents/refinement.agent.ts.
 *
 * Invoked directly via step.invoke() from the disaster-response
 * orchestrator, and also independently triggerable via its own event for
 * testing/debugging a single agent in isolation.
 */
export const dataRefinementFunction = inngest.createFunction(
  {
    id: "agent-data-refinement",
    triggers: [{ event: "resq/agent.data-refinement.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, input } = event.data as {
      workflowId: string;
      input: RefinementInput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "DATA_REFINEMENT",
      input,
      confidenceOf: (output) => output.confidence,
      run: () => runDataRefinementAgent(input, step),
    });
  }
);
