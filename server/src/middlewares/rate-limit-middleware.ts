import { redisClient } from "../lib/redis.js";
import logger from "../lib/logger.js";
import { InternalServerError, TooManyRequestsError } from "../utils/api-error.js";

const rateLimiter = async (req: any, res: any, next: any) => {
  try {
    const path = String(req.path ?? "");
    if (path.startsWith("/api/inngest") || path.startsWith("/health")) {
      return next();
    }

    const rateLimitKey = `rate-limit:${req.ip}`;
    const requests = await redisClient.incr(rateLimitKey);
    if (requests === 1) {
      await redisClient.expire(rateLimitKey, 60);
    } else if (requests > 120) {
      return res
        .status(429)
        .json(new TooManyRequestsError("Too many requests. Please try again later."));
    }
    next();
  } catch (error) {
    logger.error(error);
    return res.status(500).json(new InternalServerError("Internal Server Error"));
  }
};

export { rateLimiter };
