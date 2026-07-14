import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase, adminAuth } from "../lib/supabase";
import { signupSchema, loginSchema } from "../middleware/validate";
import { env } from "../config/env";
import { OAUTH_CONFIG, getOauthClientId, getOauthClientSecret } from "../config/oauth";
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
  const { email, password, newPassword } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email required" });

  // If newPassword provided, do admin password reset (skips email verification)
  if (newPassword) {
    try {
      const { data: users } = await adminAuth.listUsers();
      const user = users.users.find((u: any) => u.email === email);
      if (!user) return res.status(404).json({ success: false, error: "User not found" });

      const { error } = await adminAuth.updateUserById(user.id, { password: newPassword });
      if (error) return res.status(400).json({ success: false, error: error.message });

      return res.json({ success: true, message: "Password updated!" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // Old flow: send Supabase reset email
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

router.post("/social-login/:platform", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, code_verifier } = req.body;
  if (!code) return res.status(400).json({ success: false, error: "Code required" });

  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(400).json({ success: false, error: `Unknown platform: ${platform}` });

  const clientId = getOauthClientId(platform);
  const clientSecret = getOauthClientSecret(platform);
  if (!clientId) return res.status(500).json({ success: false, error: `${platform} OAuth not configured` });

  try {
    const redirectUri = platform === "tiktok"
      ? `${req.protocol}://${req.get("host")}/api/v1/oauth/tiktok/callback`
      : platform === "instagram"
      ? `${req.protocol}://${req.get("host")}/auth/callback?provider=instagram`
      : `${req.protocol}://${req.get("host")}/auth/callback?provider=${platform}`;

    const tokenBody: Record<string, string> = {
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    };
    if (platform === "instagram") {
      tokenBody.client_id = clientId;
      tokenBody.client_secret = clientSecret;
    } else if (cfg.needsBasicAuth) {
      tokenBody.client_id = clientId;
    } else if (cfg.useClientKey) {
      tokenBody.client_key = clientId;
      tokenBody.client_secret = clientSecret;
    } else {
      tokenBody.client_id = clientId;
      tokenBody.client_secret = clientSecret;
    }

    if (code_verifier) {
      tokenBody.code_verifier = code_verifier;
    }

    const tokenHeaders: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
    if (cfg?.needsBasicAuth) {
      tokenHeaders["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    }

    let tokenUrl = cfg?.tokenUrl;
    if (platform === "instagram") {
      tokenUrl = "https://api.instagram.com/oauth/access_token";
    }

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: tokenHeaders,
      body: new URLSearchParams(tokenBody),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ success: false, error: tokenData.error || "Failed to get access token" });
    }

    let email: string;
    let name: string;
    let avatar: string;
    let platformUserId: string;
    let platformUserName: string;

    if (platform === "instagram") {
      email = `instagram_${tokenData.user_id}@zyng.app`;
      name = tokenData.username || "Instagram User";
      avatar = "";
      platformUserId = tokenData.user_id?.toString();
      platformUserName = tokenData.username || "Instagram User";
    } else {
      const profileRes = await fetch(cfg.profileUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profileData = await profileRes.json();
      const parsed = cfg.profileParser(profileData);
      platformUserId = parsed.platformUserId;
      platformUserName = parsed.platformUserName;

      switch (platform) {
        case "google":
          email = profileData.email || `google_${platformUserId}@zyng.app`;
          name = platformUserName || profileData.name || "Google User";
          avatar = profileData.picture || "";
          break;
        case "linkedin":
          email = profileData.email || `linkedin_${platformUserId}@zyng.app`;
          name = platformUserName || "LinkedIn User";
          avatar = profileData.picture || "";
          break;
        default:
          email = `social_${platform}_${platformUserId}@zyng.app`;
          name = platformUserName || "User";
          avatar = "";
      }
    }

    const password = crypto.randomUUID() + "Zyng!2";
    const { data, error } = await adminAuth.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true,
    });

    let userId: string;

    if (error?.message?.includes?.("already been registered")) {
      const sbUrl = env("SUPABASE_URL");
      const sbKey = env("SUPABASE_SERVICE_ROLE_KEY");
      let existing: any = null;
      for (let page = 1; page <= 10; page++) {
        const fetchRes = await fetch(`${sbUrl}/auth/v1/admin/users?page=${page}&per_page=200`, {
          headers: { Authorization: `Bearer ${sbKey}`, apikey: sbKey },
        });
        const body = await fetchRes.json();
        existing = body.users?.find((u: any) => u.email === email);
        if (existing) break;
        if (!body.users?.length) break;
      }
      if (!existing) {
        return res.status(400).json({ success: false, error: error.message });
      }
      userId = existing.id;
      await adminAuth.updateUserById(userId, { password });
    } else if (error) {
      return res.status(400).json({ success: false, error: error.message });
    } else {
      userId = data.user!.id;
    }

    const user = {
      id: userId,
      name,
      email,
      tier: "Free",
      joined: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
      avatar,
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
