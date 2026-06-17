import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
    req.userId = data.user.id;
    next();
  } catch {
    return res.status(500).json({ success: false, error: "Auth verification failed" });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      req.userId = data.user.id;
    }
  } catch {
    // silently continue without auth
  }
  next();
}
