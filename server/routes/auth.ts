import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase, adminAuth } from "../lib/supabase";
import { signupSchema, loginSchema } from "../middleware/validate";
import { env } from "../config/env";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.post("/signup", authLimiter, async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { name, email, password } = parsed.data;

  try {
    const { data, error } = await adminAuth.createUser({
      email,
      password,
      user_metadata: { full_name: name, tier: "Free" },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Sign in to create a session so the client gets an access token
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });

    const user = {
      id: data.user!.id,
      name: data.user!.user_metadata?.full_name || name,
      email: data.user!.email,
      tier: "Free",
      joined:
        new Date().toLocaleString("en-US", { month: "long" }) +
        " " +
        new Date().getFullYear(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    return res.json({
      success: true,
      user,
      session: sessionData?.session
        ? { access_token: sessionData.session.access_token, refresh_token: sessionData.session.refresh_token }
        : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/login", authLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const tier = data.user.user_metadata?.tier || "Free";

    const user = {
      id: data.user.id,
      name: data.user.user_metadata?.full_name || email.split("@")[0],
      email: data.user.email,
      tier,
      joined: new Date(data.user.created_at).toLocaleString("en-US", { month: "long", year: "numeric" }),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.user.user_metadata?.full_name || email)}`,
    };

    return res.json({
      success: true,
      user,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/reset-password", authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.protocol}://${req.get("host")}/login`,
    });

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, message: "Password reset email sent" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/oauth-login", async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  try {
    const { data: users } = await adminAuth.listUsers();
    const existing = users.users.find((u: any) => u.email === email);

    if (existing) {
      const user = {
        id: existing.id,
        name: existing.user_metadata?.full_name || name,
        email: existing.email,
        tier: existing.user_metadata?.tier || "Free",
        joined: new Date(existing.created_at).toLocaleString("en-US", { month: "long", year: "numeric" }),
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      };
      return res.json({ success: true, user });
    }

    // Create new user via admin API
    const { data, error } = await adminAuth.createUser({
      email,
      password: crypto.randomUUID(),
      user_metadata: { full_name: name },
      email_confirm: true,
    });

    if (error) return res.status(400).json({ success: false, error: error.message });

    const user = {
      id: data.user!.id,
      name: data.user!.user_metadata?.full_name || name,
      email: data.user!.email,
      tier: "Free",
      joined: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/tiktok-login", async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: "Code required" });

  const clientKey = env("TIKTOK_CLIENT_ID");
  const clientSecret = env("TIKTOK_CLIENT_SECRET");
  if (!clientKey || !clientSecret) {
    return res.status(500).json({ success: false, error: "TikTok OAuth not configured" });
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${req.protocol}://${req.get("host")}/auth/callback?provider=tiktok`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ success: false, error: tokenData.error || "Failed to get access token" });
    }

    const profileRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const profileData = await profileRes.json();
    const tikTokUser = profileData.data?.user;
    if (!tikTokUser) {
      return res.status(400).json({ success: false, error: "Failed to get TikTok user info" });
    }

    const email = `tiktok_${tikTokUser.open_id}@zyng.app`;
    const name = tikTokUser.display_name || "TikTok User";
    const avatar = tikTokUser.avatar_url || "";

    const { data: users } = await adminAuth.listUsers();
    const existing = users.users.find((u: any) => u.email === email);

    if (existing) {
      const user = {
        id: existing.id,
        name: existing.user_metadata?.full_name || name,
        email: existing.email,
        tier: existing.user_metadata?.tier || "Free",
        joined: new Date(existing.created_at).toLocaleString("en-US", { month: "long", year: "numeric" }),
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      };
      const tempPassword = crypto.randomUUID() + "Zyng!1";
      await adminAuth.updateUserById(existing.id, { password: tempPassword });
      const { data: sd } = await supabase.auth.signInWithPassword({ email, password: tempPassword });
      return res.json({
        success: true, user,
        session: sd.session ? { access_token: sd.session.access_token, refresh_token: sd.session.refresh_token } : undefined,
      });
    }

    const password = crypto.randomUUID() + "Zyng!2";
    const { data, error } = await adminAuth.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true,
    });

    if (error) return res.status(400).json({ success: false, error: error.message });

    const user = {
      id: data.user!.id,
      name: data.user!.user_metadata?.full_name || name,
      email: data.user!.email,
      tier: "Free",
      joined: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    const { data: sd } = await supabase.auth.signInWithPassword({ email, password });
    return res.json({
      success: true, user,
      session: sd.session ? { access_token: sd.session.access_token, refresh_token: sd.session.refresh_token } : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
