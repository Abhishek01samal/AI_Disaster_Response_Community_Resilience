import { prisma } from "../lib/prisma.js";
import logger from "../lib/logger.js";

type AgentType =
  | "DATA_REFINEMENT"
  | "VALIDATION"
  | "MASTER"
  | "RISK"
  | "ROUTE"
  | "RESOURCE"
  | "RESPONSE"
  | "EVALUATION";

export async function recordAgentExecution<TInput, TOutput>(params: {
  workflowId: string;
  agentType: AgentType;
  input: TInput;
  run: () => Promise<TOutput>;
  reviewRequired?: (output: TOutput) => boolean;
  confidenceOf?: (output: TOutput) => number | undefined;
}): Promise<TOutput> {
  const execution = await prisma.agentExecution.create({
    data: {
      workflowId: params.workflowId,
      agentType: params.agentType,
      status: "RUNNING",
      input: params.input as any,
    },
  });

  try {
    const output = await params.run();
    const status = params.reviewRequired?.(output)
      ? "REVIEW_REQUIRED"
      : "SUCCESS";

    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: {
        status,
        output: output as any,
        confidence: params.confidenceOf?.(output) ?? null,
        completedAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    logger.error(
      `Agent ${params.agentType} failed for workflow ${params.workflowId}: ${error?.message}`
    );

    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        errorMessage: String(error?.message ?? error),
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
