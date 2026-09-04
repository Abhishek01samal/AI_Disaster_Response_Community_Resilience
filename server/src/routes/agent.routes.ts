import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { validateData } from "../middlewares/zod-validation.js";
import {
  submitReportSchema,
  submitSosSchema,
} from "../validators/ingestion.js";
import {
  submitReport,
  submitSos,
} from "../controllers/ingestion.controller.js";
import {
  getWorkflowById,
  listWorkflows,
} from "../controllers/workflow.controller.js";

const router: Router = express.Router();

router.post(
  "/reports",
  authMiddleware,
  validateData(submitReportSchema),
  submitReport
);
router.post("/sos", authMiddleware, validateData(submitSosSchema), submitSos);

router.get("/workflows", authMiddleware, listWorkflows);
router.get("/workflows/:id", authMiddleware, getWorkflowById);

export { router as agentRouter };
