import express, { Router } from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { validateData } from "../middlewares/zod-validation.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth-schema.js";
import { authMiddleware } from "../middlewares/auth-middleware.js";
import {
  getGithubLoginCallback,
  getGoogleLoginCallback,
  githubLogin,
  googleLogin,
} from "../controllers/oauth.controller.js";

const router:Router = express.Router();

router.post("/register", validateData(registerSchema), registerUser);
router.post("/login", validateData(loginSchema), loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/verify-email", verifyEmail);
router.post(
  "/forgot-password",
  validateData(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  validateData(resetPasswordSchema),
  resetPassword
);
router.post("/refresh-token", refreshAccessToken);
router.get("/google", googleLogin);
router.get("/google/callback", getGoogleLoginCallback);
router.get("/github", githubLogin);
router.get("/github/callback", getGithubLoginCallback);

export { router as authRouter };
