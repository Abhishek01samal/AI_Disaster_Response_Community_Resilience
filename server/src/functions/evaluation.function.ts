import { inngest } from "../lib/inngest.js";
import { prisma } from "../lib/prisma.js";
import {
  runEvaluationAgent,
  type EvaluationInput,
} from "../agents/evaluation-agent.js";
import { recordAgentExecution } from "../agents/execution-logger.js";

/**
 * 8. Evaluation Agent (deterministic)
 * Final safety gate over every upstream agent output. Never delegated to an
 * LLM — see agents/evaluation.agent.ts.
 */
export const evaluationFunction = inngest.createFunction(
  {
    id: "agent-evaluation",
    triggers: [{ event: "resq/agent.evaluation.run" }],
  },
  async ({ event, step }) => {
    const input = event.data as EvaluationInput;

    const output = await recordAgentExecution({
      workflowId: input.workflowId,
      agentType: "EVALUATION",
      input,
      reviewRequired: (o) => o.humanReviewRequired,
      run: () =>
        step.run("run-evaluation-checks", () => runEvaluationAgent(input)),
    });

    await step.run("persist-evaluation-result", () =>
      prisma.evaluationResult.create({
        data: {
          workflowId: output.workflowId,
          status: output.evaluationStatus,
          evidenceSupported: output.checks.evidenceSupported,
          sourceVerified: output.checks.sourceVerified,
          confidenceAcceptable: output.checks.confidenceAcceptable,
          dataFresh: output.checks.dataFresh,
          outputsConsistent: output.checks.agentOutputsConsistent,
          safetyPolicyPassed: output.checks.safetyPolicyPassed,
          explainabilityPresent: output.checks.explainabilityPresent,
          humanReviewRequired: output.humanReviewRequired,
          reasons: output.reviewReasons,
          approvedOutputs: output.approvedOutputs,
          blockedOutputs: output.blockedOutputs,
        },
      })
    );

    return output;
  }
);
