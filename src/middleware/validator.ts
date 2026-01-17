import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "./errorHandler";

/**
 * Validation middleware factory
 */
export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
        return;
      }
      next(new AppError("Validation error", 400));
    }
  };
};
