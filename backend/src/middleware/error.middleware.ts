import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors/AppErrors";
import { env } from "../config/env";

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  
  const response = {
    status: statusCode >= 500 ? "error" : "fail",
    message: err.message || "Internal Server Error",
    ...(env.NODE_ENV === "development" && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};