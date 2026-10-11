// common/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { CustomError } from "./CustomError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      errors: err.serializeErrors(),
    });
  }

  // Fallback for unhandled/500 errors
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    success: false,
    errors: [{ message: "Internal server error" }],
  });
};