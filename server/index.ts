import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { validateEnv } from "./config/env";
import { requireAuth } from "./middleware/auth";

validateEnv();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.set("trust proxy", true);
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

import authRoutes from "./routes/auth";
import postsRoutes from "./routes/posts";
import aiRoutes from "./routes/ai";
import oauthRoutes from "./routes/oauth";

// v1 API — full JWT auth on posts
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/posts", requireAuth, postsRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/oauth", oauthRoutes);

// Legacy API — backward compatible (user_id in query param)
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/oauth", oauthRoutes);

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
  });
}

startServer();
