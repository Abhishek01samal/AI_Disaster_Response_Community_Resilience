import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { validateData } from "../middlewares/zod-validation.js";
import {
  submitReportSchema,
  submitSosSchema,
  chatSchema,
  confirmMatchSchema,
} from "../validators/ingestion.js";
import {
  submitReport,
  submitSos,
} from "../controllers/ingestion.controller.js";
import {
  chatGuidance,
  confirmResourceMatch,
} from "../controllers/ops.controller.js";
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

router.post("/chat", authMiddleware, validateData(chatSchema), chatGuidance);
router.post(
  "/matches/confirm",
  authMiddleware,
  validateData(confirmMatchSchema),
  confirmResourceMatch
);

router.get("/workflows", authMiddleware, listWorkflows);
router.get("/workflows/:id", authMiddleware, getWorkflowById);

export { router as agentRouter };
