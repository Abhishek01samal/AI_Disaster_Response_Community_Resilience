import type { Request, Response } from "express";
import AsyncHandler from "../utils/async-handler.js";
import ApiResponse from "../utils/api-response.js";

/**
 * @route GET /
 * @description Root controller to check server status
 * @access public
 */
const rootController = AsyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, "Server up n running..."));
});

/**
 * @route GET /health-check
 * @description Health check controller to verify server health
 * @access public
 */
const healthCheckController = AsyncHandler(
  async (_req: Request, res: Response) => {
    res.status(200).json(new ApiResponse(200, "Server is running healthy..."));
  }
);

export { rootController, healthCheckController };
