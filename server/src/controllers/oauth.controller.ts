import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import AsyncHandler from "../utils/async-handler.js";
import { google } from "../utils/google.js";
import { redisClient } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import type { IPayload } from "../types/jwt.types.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth-middleware.js";
import { accessTokenOptions, refreshTokenOptions } from "../utils/constants.js";
import { github } from "../utils/github.js";
import crypto from "crypto";
import { ENV } from "../lib/env.js";
import logger from "../lib/logger.js";
import { sendOauthWelcomeMail } from "../utils/send-mails.js";

/**
 * @route POST /auth/google
 * @desc controller to oauth google login
 * @access public
 */
export const googleLogin = AsyncHandler(async (req: any, res: any) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);
  await redisClient.set(
    `oauth:google-state:${state}`,
    codeVerifier,
    "EX",
    5 * 60
  );
  // res.cookie("google_oauth_state", state, accessTokenOptions);
  // res.cookie("google_oauth_codeVerifier", codeVerifier, accessTokenOptions);
  res.redirect(url.toString());
});

/**
 * @route POST /auth/google/callback
 * @desc controller to oauth google login callback
 * @access public
 */
export const getGoogleLoginCallback = AsyncHandler(
  async (req: any, res: any) => {
    const { code, state } = req.query;
    // console.log(code);
    // console.log(state);

    const storedCodeVerifier = await redisClient.get(
      `oauth:google-state:${state}`
    );

    if (!code || !state || !storedCodeVerifier) {
      return res.redirect(
        `${ENV.FRONTEND_URL}/sign-in?error=oauth_state_mismatch`
      );
    }
    try {
      let tokens = await google.validateAuthorizationCode(
        code,
        storedCodeVerifier
      );

      const idToken = tokens.idToken();
      const claims: any = decodeIdToken(idToken);

      const googleUserId = claims.sub;
      const name = claims.name;
      const email = claims.email;

      // 1 Check if OAuth account exists
      let oauthAccount = await prisma.oAuthProvider.findUnique({
        where: {
          providerName_providerUserId: {
            providerName: "GOOGLE",
            providerUserId: googleUserId,
          },
        },
      });

      let user;

      if (oauthAccount) {
        // existing user login
        user = await prisma.user.findUnique({
          where: { id: oauthAccount.userId },
        });
      } else {
        user = await prisma.$transaction(async (tx) => {
          // 2 Check if email already exists
          let existingUser = await tx.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            // 3 Create new user
            existingUser = await tx.user.create({
              data: {
                name,
                email,
                isVerified: true,
              },
            });
          }

          // 4 Create OAuth mapping
          await tx.oAuthProvider.create({
            data: {
              userId: existingUser.id,
              providerName: "GOOGLE",
              providerUserId: googleUserId,
            },
          });

          return existingUser;
        });

        // Send welcome email only for new users
        sendOauthWelcomeMail(
          user?.name,
          user?.email,
          "Google",
          `${ENV.FRONTEND_URL}/dashboard`
        );
      }

      if (!user)
        return res.redirect(
          `${ENV.FRONTEND_URL}/sign-in?error=user_creation_failed`
        );

      // 5 Generate JWT like normal login
      const sessionId = crypto.randomBytes(16).toString("hex");
      const payload: IPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // set refresh token in redis
      await redisClient.set(
        `refresh-token:${user.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60
      );
      // set active session ID
      await redisClient.set(
        `active-session:${user.id}`,
        sessionId,
        "EX",
        7 * 24 * 60 * 60
      );

      await redisClient.del(`oauth:google-state:${state}`);
      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      logger.info(`Google OAuth login successful for ${user.email}`);

      //  Redirect to frontend dashboard
      return res.redirect(`${ENV.FRONTEND_URL}/dashboard`);
    } catch (error) {
      logger.error("Google OAuth Error:", error);
      return res.redirect(
        `${ENV.FRONTEND_URL}/sign-in?error=google_oauth_failed`
      );
    }
  }
);

/**
 * @route POST /auth/github
 * @desc controller to oauth github login
 * @access public
 */
export const githubLogin = AsyncHandler(async (req: any, res: any) => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ["user:email"]);
  await redisClient.set(
    `oauth:github-state:${state}`,
    "VALID_GITHUB_STATE",
    "EX",
    5 * 60
  );
  // res.cookie("github_oauth_state", state, accessTokenOptions);
  res.redirect(url.toString());
});

/**
 * @route POST /auth/github/callback
 * @desc controller to oauth github login callback
 * @access public
 */
export const getGithubLoginCallback = AsyncHandler(
  async (req: any, res: any) => {
    const { code, state } = req.query;
    // console.log("Github Code:", code);
    // console.log("Github State:", state);

    // const storedState = req.cookies.github_oauth_state;

    if (!code || !state) {
      return res.redirect(
        `${ENV.FRONTEND_URL}/sign-in?error=oauth_state_mismatch`
      );
    }
    const stored = await redisClient.get(`oauth:github-state:${state}`);

    if (!stored) {
      return res.redirect(
        `${ENV.FRONTEND_URL}/sign-in?error=invalid_or_expired_state`
      );
    }
    try {
      let tokens = await github.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken();

      const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const githubUser: any = await githubUserResponse.json();

      const githubUserId = String(githubUser.id);
      const name = githubUser.name || githubUser.login;

      let email = githubUser.email;

      if (!email) {
        const emailsResponse = await fetch(
          "https://api.github.com/user/emails",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const emails: any = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary) ?? emails[0];
        email = primaryEmail.email;
      }

      let oauthAccount = await prisma.oAuthProvider.findUnique({
        where: {
          providerName_providerUserId: {
            providerName: "GITHUB",
            providerUserId: githubUserId,
          },
        },
      });

      let user;

      if (oauthAccount) {
        user = await prisma.user.findUnique({
          where: { id: oauthAccount.userId },
        });
      } else {
        user = await prisma.$transaction(async (tx) => {
          let existingUser = await tx.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            existingUser = await tx.user.create({
              data: {
                name,
                email,
                isVerified: true,
              },
            });
          }

          await tx.oAuthProvider.create({
            data: {
              userId: existingUser.id,
              providerName: "GITHUB",
              providerUserId: githubUserId,
            },
          });

          return existingUser;
        });

        // Send welcome email only for new users
        sendOauthWelcomeMail(
          user?.name,
          user?.email,
          "GitHub",
          `${ENV.FRONTEND_URL}/dashboard`
        );
      }

      if (!user) {
        return res.redirect(
          `${ENV.FRONTEND_URL}/sign-in?error=user_creation_failed`
        );
      }

      const sessionId = crypto.randomBytes(16).toString("hex");
      const payload: IPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId,
      };

      const loginAccessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      await redisClient.set(
        `refresh-token:${user.id}`,
        refreshToken,
        "EX",
        7 * 24 * 60 * 60
      );
      await redisClient.set(
        `active-session:${user.id}`,
        sessionId,
        "EX",
        7 * 24 * 60 * 60
      );
      await redisClient.del(`oauth:github-state:${state}`);
      res.cookie("accessToken", loginAccessToken, accessTokenOptions);
      res.cookie("refreshToken", refreshToken, refreshTokenOptions);

      logger.info(`GitHub OAuth login successful for ${user.email}`);

      return res.redirect(`${ENV.FRONTEND_URL}/dashboard`);
    } catch (error) {
      logger.error("GitHub OAuth Error:", error);
      return res.redirect(
        `${ENV.FRONTEND_URL}/sign-in?error=github_oauth_failed`
      );
    }
  }
);
