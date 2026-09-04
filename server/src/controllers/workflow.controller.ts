import { prisma } from "../lib/prisma.js";
import AsyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";
import { NotFoundError } from "../utils/api-error.js";

/**
 * @route GET /api/v1/workflows/:id
 * @description Fetch a single AgentWorkflow with its full AgentExecution
 *              timeline and evaluation result, for status polling / audit.
 * @access private
 */
const getWorkflowById = AsyncHandler(async (req: any, res: any) => {
  const { id } = req.params;

  const workflow = await prisma.agentWorkflow.findUnique({
    where: { id },
    include: {
      executions: { orderBy: { startedAt: "asc" } },
    },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow not found");
  }

  const evaluation = await prisma.evaluationResult.findFirst({
    where: { workflowId: id },
    orderBy: { createdAt: "desc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Workflow fetched successfully", {
        workflow,
        evaluation,
      })
    );
});

/**
 * @route GET /api/v1/workflows
 * @description List recent workflows (most recent first), optionally
 *              filtered by status, for an ops/dashboard view.
 * @access private
 */
const listWorkflows = AsyncHandler(async (req: any, res: any) => {
  const { status, limit } = req.query;

  const workflows = await prisma.agentWorkflow.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: "desc" },
    take: limit ? Math.min(Number(limit), 100) : 25,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Workflows fetched successfully", { workflows })
    );
});

export { getWorkflowById, listWorkflows };
