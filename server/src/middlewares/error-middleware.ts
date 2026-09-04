import logger from "../lib/logger.js";
import ApiError, {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "../utils/api-error.js";

const errorMiddleware = (err: any, _req: any, res: any, _next: any) => {
  if (err instanceof ApiError) {
    logger.error(err.stack);
    return res.status(err.statusCode).json(err);
  }

  if (err?.name === "ZodError") {
    const zodError = new BadRequestError(
      err.issues?.[0]?.message ?? "Validation error"
    );
    logger.error(zodError.stack);
    return res.status(zodError.statusCode).json(zodError);
  }

  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    const authError = new UnauthorizedError("Unauthorized");
    logger.error(authError.stack);
    return res.status(authError.statusCode).json(authError);
  }

  logger.error("[UNHANDLED_ERROR]: ", err.stack);
  return res
    .status(500)
    .json(new InternalServerError(err?.message ?? "Internal Server Error"));
};

export default errorMiddleware;
