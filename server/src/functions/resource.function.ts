import { inngest } from "../lib/inngest.js";
import { runResourceReliefAgent } from "../agents/resource-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { ResourceInput } from "../agents/schemas.js";

/**
 * 6. Resource & Relief Agent (deterministic matching + AI-assisted narrative)
 * Matching quantities/allocations are always deterministic; an LLM may only
 * phrase the "reasons" text. requiresHumanConfirmation is always true.
 */
export const resourceFunction = inngest.createFunction(
  {
    id: "agent-resource",
    triggers: [{ event: "resq/agent.resource.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, input } = event.data as {
      workflowId: string;
      input: ResourceInput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "RESOURCE",
      input,
      reviewRequired: () => true, // resource allocation is always high-impact
      run: () => runResourceReliefAgent(input, step),
    });
  }
);
