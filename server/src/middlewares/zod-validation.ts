import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { BadRequestError, InternalServerError } from "../utils/api-error.js";

export function validateData(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0];

        if (!firstError) {
          throw new BadRequestError("Invalid request data");
        }

        const errorMessage = firstError.message;

        throw new BadRequestError(errorMessage);
      }

      throw new InternalServerError("Internal Server Error");
    }
  };
}
