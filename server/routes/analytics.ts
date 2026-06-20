import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.get("/dashboard", async (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || req.userId;
  if (!userId) return res.status(400).json({ success: false, error: "user_id required" });

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const postCount = posts?.length || 0;
    const scheduledCount = posts?.filter((p: any) => new Date(p.schedule_time) > new Date()).length || 0;
    const publishedCount = posts?.filter((p: any) => {
      try {
        const pr = typeof p.publish_results === "string" ? JSON.parse(p.publish_results) : p.publish_results;
        return Array.isArray(pr) && pr.some((r: any) => r.success);
      } catch { return false; }
    }).length || 0;

    const platformCounts: Record<string, number> = {};
    for (const p of posts || []) {
      const platforms = typeof p.platforms === "string" ? p.platforms.split(",") : p.platforms || [];
      for (const pf of platforms) {
        const key = pf.trim().toLowerCase();
        if (key) platformCounts[key] = (platformCounts[key] || 0) + 1;
      }
    }

    const platformDistribution = Object.entries(platformCounts)
      .map(([name, count]) => ({ name, count, percentage: postCount ? Math.round((count / postCount) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const recentPosts = (posts || []).slice(0, 5).map((p: any) => ({
      caption: p.caption?.substring(0, 80),
      platforms: typeof p.platforms === "string" ? p.platforms.split(",") : p.platforms || [],
      created_at: p.created_at,
      schedule_time: p.schedule_time,
      status: p.publish_results ? "published" : "scheduled",
    }));

    const { data: accounts } = await supabase.rpc("get_connected_accounts", { p_user_id: userId });
    const connectedPlatforms = (accounts as any[] || []).map((a: any) => a.platform);

    const postsByDay: Record<string, number> = {};
    for (const p of posts || []) {
      const day = p.created_at?.split("T")[0];
      if (day) postsByDay[day] = (postsByDay[day] || 0) + 1;
    }
    const postsOverTime = Object.entries(postsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      stats: {
        totalPosts: postCount,
        scheduledPosts: scheduledCount,
        publishedPosts: publishedCount,
        connectedPlatforms: connectedPlatforms.length,
        platformDistribution,
        recentPosts,
        postsOverTime,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
