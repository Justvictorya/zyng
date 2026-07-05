import { Router, Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { supabase, adminAuth } from "../lib/supabase";

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

router.post("/invite", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  try {
    const { data: owner } = await adminAuth.getUserById(userId);
    const ownerMeta = owner.user?.user_metadata || {};
    if (ownerMeta.tier !== "Enterprise") {
      return res.status(403).json({ success: false, error: "Team accounts require Enterprise plan" });
    }

    const { email, role } = parsed.data;

    if (email === owner.user?.email) {
      return res.status(400).json({ success: false, error: "Cannot invite yourself" });
    }

    const { data: existing } = await supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", userId)
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: "Already invited or a member" });
    }

    const memberName = email.split("@")[0];
    let tempPassword: string | null = null;

    // Check if user exists in Supabase Auth
    const { data: users } = await adminAuth.listUsers();
    const existingUser = users.users.find((u: any) => u.email === email);
    let memberId: string | null = existingUser?.id || null;

    if (!existingUser) {
      tempPassword = crypto.randomUUID() + "ZyngTm!";
      const { data: newUser, error: createError } = await adminAuth.createUser({
        email,
        password: tempPassword,
        user_metadata: { full_name: memberName, tier: "Free" },
        email_confirm: true,
      });
      if (createError) return res.status(500).json({ success: false, error: createError.message });
      memberId = newUser.user!.id;
    }

    const { data: member, error } = await supabase
      .from("team_members")
      .insert({
        owner_id: userId,
        member_id: memberId,
        email,
        role,
        status: existingUser ? "active" : "pending",
        joined_at: existingUser ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({
      success: true,
      member,
      temp_password: tempPassword,
      message: existingUser
        ? `${email} has been added to your team`
        : `Invitation sent to ${email}. Share the temporary password with them.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/members", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", userId)
      .order("invited_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, members: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/members/:id", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", req.params.id)
      .eq("owner_id", userId);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, message: "Member removed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/resend/:id", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data: member, error: fetchError } = await supabase
      .from("team_members")
      .select("*")
      .eq("id", req.params.id)
      .eq("owner_id", userId)
      .single();

    if (fetchError || !member) {
      return res.status(404).json({ success: false, error: "Member not found" });
    }

    return res.json({ success: true, message: `Invitation re-sent to ${member.email}. If they don't have an account yet, create a new invite instead.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
