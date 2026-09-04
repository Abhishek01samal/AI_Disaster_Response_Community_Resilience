import express, { Router } from "express";
import {
  healthCheckController,
  rootController,
} from "../controllers/root.controller.js";

const router:Router = express.Router();

router.get("/", rootController);
router.get("/health", healthCheckController);

export { router as rootRouter };
