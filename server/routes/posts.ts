import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { createPostSchema, updatePostSchema } from "../middleware/validate";

const router = Router();

function getUserId(req: Request): string | null {
  if (req.userId) return req.userId;
  return (req.query.user_id as string) || null;
}

router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, posts: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  }

  const { caption, platforms, schedule_time } = parsed.data;

  try {
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          caption,
          platforms: Array.isArray(platforms) ? platforms.join(",") : platforms,
          schedule_time: schedule_time || new Date(Date.now() + 3600000).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, post: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  }

  const { id } = req.params;
  const updates: any = {};

  if (parsed.data.caption !== undefined) updates.caption = parsed.data.caption;
  if (parsed.data.platforms !== undefined) {
    updates.platforms = Array.isArray(parsed.data.platforms)
      ? parsed.data.platforms.join(",")
      : parsed.data.platforms;
  }
  if (parsed.data.schedule_time !== undefined) updates.schedule_time = parsed.data.schedule_time;

  try {
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, post: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const { id } = req.params;

  try {
    const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", userId);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
