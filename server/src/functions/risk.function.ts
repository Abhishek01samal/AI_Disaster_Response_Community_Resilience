import { inngest } from "../lib/inngest.js";
import { runRiskIntelligenceAgent } from "../agents/risk-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";
import type { RiskInput } from "../agents/schemas.js";

/**
 * 4. Risk Intelligence Agent (AI-backed)
 * Interprets reports + official alerts into an AI_SIGNAL risk assessment.
 * Never promotes itself to OFFICIAL/VERIFIED truth.
 */
export const riskFunction = inngest.createFunction(
  {
    id: "agent-risk",
    triggers: [{ event: "resq/agent.risk.run" }],
  },
  async ({ event, step }) => {
    const { workflowId, input } = event.data as {
      workflowId: string;
      input: RiskInput;
    };

    return recordAgentExecution({
      workflowId,
      agentType: "RISK",
      input,
      confidenceOf: (output) => output.confidence,
      run: () => runRiskIntelligenceAgent(input, step),
    });
  }
);
