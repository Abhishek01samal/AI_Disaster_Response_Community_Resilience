import type { Request, Response, NextFunction } from "express";

const AsyncHandler = (fn: any) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const result = await fn(req, res, next);
      return result;
    } catch (error: any) {
      next(error);
    }
  };
};

export default AsyncHandler;
