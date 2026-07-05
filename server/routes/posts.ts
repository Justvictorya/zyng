import { Router, Request, Response } from "express";
import { supabase, adminAuth, serviceDb } from "../lib/supabase";
import { createPostSchema, updatePostSchema } from "../middleware/validate";
import { savePostMedia, getPostMedia, getAllMedia, deletePostMedia } from "../lib/storage";
import { publishPost } from "../lib/publisher";
import { recordPublishResults } from "../lib/scheduler";

const router = Router();

function getUserId(req: Request): string | null {
  return req.userId || null;
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

    const posts = data || [];
    const ids = posts.map((p: any) => p.id);
    const mediaMap = getAllMedia(ids);

    const enriched = posts.map((p: any) => ({
      ...p,
      media_urls: JSON.stringify(mediaMap[p.id] || []),
    }));

    return res.json({ success: true, posts: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const { data: userData, error: userError } = await adminAuth.getUserById(userId);
  if (userError) return res.status(500).json({ success: false, error: userError.message });

  const tier = userData.user?.user_metadata?.tier || "Free";

  // Free tier: max 10 posts per month, max 2 connected channels
  if (tier === "Free") {
    const { data: accounts } = await supabase.rpc("get_connected_accounts", { p_user_id: userId });
    const connectedCount = (accounts as any[] || []).length;
    if (connectedCount > 2) {
      return res.status(403).json({ success: false, error: "Free plan limited to 2 connected channels. Upgrade to Pro." });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());
    if (count && count >= 10) {
      return res.status(403).json({ success: false, error: "Free plan limited to 10 posts per month. Upgrade to Pro for unlimited." });
    }
  }

  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { caption, platforms, media_urls, platform_captions, platform_schedule, schedule_time } = parsed.data;

  try {
    const insertData: any = {
      user_id: userId,
      caption,
      platforms: Array.isArray(platforms) ? platforms.join(",") : platforms,
      schedule_time: schedule_time || new Date(Date.now() + 3600000).toISOString(),
    };
    if (platform_captions) insertData.platform_captions = JSON.stringify(platform_captions);
    if (platform_schedule) insertData.platform_schedule = JSON.stringify(platform_schedule);

    const { data, error } = await supabase
      .from("posts")
      .insert([insertData])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    const urls = media_urls
      ? Array.isArray(media_urls) ? media_urls : media_urls.split(",").filter(Boolean)
      : [];

    if (urls.length > 0) await savePostMedia(data.id, urls);

    const platformList = Array.isArray(platforms) ? platforms : platforms.split(",").map((p: string) => p.trim()).filter(Boolean);

    if (platformList.length > 0) {
      publishPost(data.id, userId, caption, platformList, urls, platform_captions)
        .then((results) => recordPublishResults(data.id, results))
        .catch((err) => console.error(`[Publisher] Post ${data.id} publish error:`, err));
    }

    return res.json({ success: true, post: { ...data, media_urls: JSON.stringify(urls) } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
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
  if (parsed.data.platform_captions !== undefined) {
    updates.platform_captions = JSON.stringify(parsed.data.platform_captions);
  }
  if (parsed.data.platform_schedule !== undefined) {
    updates.platform_schedule = JSON.stringify(parsed.data.platform_schedule);
  }

  try {
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    if (parsed.data.media_urls !== undefined) {
      const urls = Array.isArray(parsed.data.media_urls)
        ? parsed.data.media_urls
        : parsed.data.media_urls.split(",").filter(Boolean);
      await savePostMedia(id, urls);
    }

    const existingMedia = getPostMedia(id);
    return res.json({
      success: true,
      post: { ...data, media_urls: JSON.stringify(existingMedia) },
    });
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
    deletePostMedia(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/:id/publish", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  const { id } = req.params;

  try {
    const { data: post } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!post) return res.status(404).json({ success: false, error: "Post not found" });

    const platforms = typeof post.platforms === "string"
      ? post.platforms.split(",").map((p: string) => p.trim()).filter(Boolean)
      : post.platforms || [];

    const mediaUrls: string[] = [];
    try {
      const parsed = typeof post.media_urls === "string"
        ? JSON.parse(post.media_urls)
        : post.media_urls || [];
      if (Array.isArray(parsed)) mediaUrls.push(...parsed);
    } catch {}

    let platformCaptions: Record<string, string> | undefined;
    try {
      const parsed = typeof post.platform_captions === "string"
        ? JSON.parse(post.platform_captions)
        : post.platform_captions;
      if (parsed && typeof parsed === "object") platformCaptions = parsed;
    } catch {}

    const results = await publishPost(
      post.id,
      post.user_id,
      post.caption || "",
      platforms,
      mediaUrls,
      platformCaptions
    );

    recordPublishResults(post.id, results);

    // Mark as processed in DB so scheduler won't re-pick it up
    try {
      await serviceDb
        .from("posts")
        .update({ schedule_time: "2099-01-01T00:00:00Z" })
        .eq("id", post.id);
    } catch (e) {
      console.error(`[Posts] Failed to mark post ${post.id} as processed:`, e);
    }

    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
