import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message || err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
