import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../utils/api-error.js";
import type { IPayload } from "../types/jwt.types.js";
import { ENV } from "../lib/env.js";
import { redisClient } from "../lib/redis.js";
import { Role } from "@prisma/client";

const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const authorization = req?.headers?.authorization;
    const token = req?.cookies?.accessToken || authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json(new UnauthorizedError("Token expired"));
    }
    const decoded = jwt.verify(token, ENV.ACCESS_TOKEN_SECRET) as IPayload;

    if (decoded.sessionId) {
      const activeSession = await redisClient.get(
        `active-session:${decoded.id}`
      );
      if (!activeSession || activeSession !== decoded.sessionId) {
        return res
          .status(401)
          .json(
            new UnauthorizedError(
              "Session expired. You logged in from another device."
            )
          );
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json(new UnauthorizedError("Token expired"));
    }
    return res.status(401).json(new UnauthorizedError("Unauthorized request"));
  }
};

const generateAccessToken = (userData: IPayload) => {
  return jwt.sign(userData, ENV.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userData: IPayload) => {
  return jwt.sign(userData, ENV.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

const authorizeAdmin = async (req: any, res: any, next: any) => {
  try {
    if (req?.user?.role !== Role.Admin) {
      throw new ForbiddenError("Forbidden Request");
    }
    next();
  } catch (error) {
    return res.status(403).json(new ForbiddenError("Forbidden Request"));
  }
};

export {
  authMiddleware,
  generateAccessToken,
  generateRefreshToken,
  authorizeAdmin,
};
