import { Router, Request, Response } from "express";
import { z } from "zod";
import { adminAuth } from "../lib/supabase";

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().max(500).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.get("/profile", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data, error } = await adminAuth.getUserById(userId);
    if (error) return res.status(500).json({ success: false, error: error.message });

    const meta = data.user?.user_metadata || {};
    return res.json({
      success: true,
      profile: {
        id: data.user.id,
        email: data.user.email,
        name: meta.full_name || "",
        avatar: meta.avatar_url || "",
        tier: meta.tier || "Free",
        created_at: data.user.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/profile", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const { data: current } = await adminAuth.getUserById(userId);
    const existingMeta = current.user?.user_metadata || {};

    const updateMeta: Record<string, any> = {};
    if (parsed.data.name !== undefined) updateMeta.full_name = parsed.data.name;
    if (parsed.data.avatar !== undefined) updateMeta.avatar_url = parsed.data.avatar;

    const { data, error } = await adminAuth.updateUserById(userId, {
      user_metadata: { ...existingMeta, ...updateMeta },
    });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      profile: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || "",
        avatar: data.user.user_metadata?.avatar_url || "",
        tier: data.user.user_metadata?.tier || "Free",
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/password", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const { data, error } = await adminAuth.updateUserById(userId, {
      password: parsed.data.newPassword,
    });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
