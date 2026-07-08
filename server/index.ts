import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { validateEnv, ENV_SNAPSHOT } from "./config/env";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

validateEnv();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.set("trust proxy", 1);
app.use(express.json());

// Healthcheck — must be before HTTPS redirect (Railway checks via HTTP)
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// HTTPS redirect for production behind Railway/reverse proxy
app.use((req, res, next) => {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  if (proto === "http" && process.env.NODE_ENV === "production") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// CORS — restrict to same origin in production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const allowed =
    !origin ||
    origin === `https://${host}` ||
    origin === `http://${host}` ||
    origin === `http://localhost:${PORT}` ||
    origin === `http://localhost:5173` ||
    process.env.NODE_ENV !== "production";
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", allowed ? origin : "null");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

import authRoutes from "./routes/auth";
import postsRoutes from "./routes/posts";
import aiRoutes from "./routes/ai";
import oauthRoutes from "./routes/oauth";
import analyticsRoutes from "./routes/analytics";
import paymentsRoutes from "./routes/payments";
import profileRoutes from "./routes/profile";
import teamRoutes from "./routes/team";

import uploadRoutes from "./routes/upload";

// v1 API — full JWT auth on posts
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", requireAuth, postsRoutes);
app.use("/api/v1/ai", requireAuth, aiRoutes);
app.use("/api/v1/oauth", oauthRoutes);
app.use("/api/v1/upload", requireAuth, uploadRoutes);
app.use("/api/v1/analytics", requireAuth, analyticsRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/profile", requireAuth, profileRoutes);
app.use("/api/v1/team", requireAuth, teamRoutes);

// Legacy API — backward compatible
app.use("/api/auth", authRoutes);
app.use("/api/posts", requireAuth, postsRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/upload", requireAuth, uploadRoutes);
app.use("/api/analytics", requireAuth, analyticsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/profile", requireAuth, profileRoutes);
app.use("/api/team", requireAuth, teamRoutes);

// Debug endpoint to check OAuth env vars — only in dev
app.get("/api/debug/oauth-env", (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not available in production" });
  const vars = ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET", "TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_SECRET", "FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET"];
  const status: Record<string, string> = {};
  for (const v of vars) {
    status[v] = process.env[v] ? `set (${process.env[v]!.substring(0, 4)}...)` : "NOT SET";
  }
  res.json(status);
});

// Direct env test — only in dev
app.get("/api/debug/env-raw", (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(404).json({ error: "Not available in production" });
  res.json({
    TWITTER_CLIENT_ID: ENV_SNAPSHOT.TWITTER_CLIENT_ID ? ENV_SNAPSHOT.TWITTER_CLIENT_ID.substring(0, 8) + "..." : "missing",
    TWITTER_CLIENT_SECRET: ENV_SNAPSHOT.TWITTER_CLIENT_SECRET ? ENV_SNAPSHOT.TWITTER_CLIENT_SECRET.substring(0, 8) + "..." : "missing",
    TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID ? process.env.TIKTOK_CLIENT_ID.substring(0, 8) + "..." : "missing",
    NODE_ENV: process.env.NODE_ENV,
  });
});

// TikTok domain verification
app.use("/tiktokHcxqbpmiTCc1GXNgZbQfoVFWw8b90XTT.txt", (_req, res) => {
  res.type("text/plain").send("tiktok-developers-site-verification=HcxqbpmiTCc1GXNgZbQfoVFWw8b90XTT");
});

import { startScheduler } from "./lib/scheduler";
import { serviceDb } from "./lib/supabase";

// Check oauth_states table exists on startup
(async () => {
  try {
    const { error } = await serviceDb.from("oauth_states").select("state_id").limit(1);
    if (error && error.message?.includes("does not exist")) {
      console.warn("[OAuth] oauth_states table missing — OAuth connect will fail!");
    }
  } catch {}
})();

// Error handler — after all routes
app.use(errorHandler);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Zyng in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Zyng in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Zyng server running on port ${PORT}`);
    startScheduler();
  });
}

startServer();
