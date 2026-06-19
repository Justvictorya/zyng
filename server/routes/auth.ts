import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase, adminAuth } from "../lib/supabase";
import { signupSchema, loginSchema } from "../middleware/validate";
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
      user_metadata: { full_name: name },
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

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

    return res.json({ success: true, user });
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

    const user = {
      id: data.user.id,
      name: data.user.user_metadata?.full_name || email.split("@")[0],
      email: data.user.email,
      tier: "Pro",
      joined: "May 2026",
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

router.post("/reset-password", async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const { data: users } = await adminAuth.listUsers();
    const user = users.users.find((u: any) => u.email === email);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    await adminAuth.updateUserById(user.id, { password: "password123" });
    return res.json({ success: true, message: "Password reset to password123" });
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
        tier: "Pro",
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

export default router;
