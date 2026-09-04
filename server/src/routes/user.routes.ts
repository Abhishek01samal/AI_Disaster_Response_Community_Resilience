import express, { Router } from "express";

import { authMiddleware } from "../middlewares/auth-middleware.js";
import {
  changePassword,
  getUserProfile,
  verifyUserEmail,
} from "../controllers/user.controller.js";
import { validateData } from "../middlewares/zod-validation.js";
import { changePasswordSchema } from "../validators/auth-schema.js";

const router:Router = express.Router();

router.post("/verify-email", authMiddleware, verifyUserEmail);
router.get("/profile", authMiddleware, getUserProfile);
router.patch(
  "/change-password",
  authMiddleware,
  validateData(changePasswordSchema),
  changePassword
);

export { router as userRouter };
