import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getPublishResults } from "../lib/scheduler";

const router = Router();

const PROCESSED_MARKER = "2099-01-01";

function isPublished(post: any): boolean {
  const mem = getPublishResults(post.id);
  if (mem && mem.length > 0) return mem.some((r) => r.success);
  try {
    const pr = typeof post.publish_results === "string" ? JSON.parse(post.publish_results) : post.publish_results;
    if (Array.isArray(pr)) return pr.some((r: any) => r.success);
  } catch {}
  return typeof post.schedule_time === "string" && post.schedule_time.startsWith(PROCESSED_MARKER);
}

function parseResults(raw: any): { platform: string; success: boolean }[] {
  try {
    const pr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(pr)) return pr;
  } catch {}
  return [];
}

router.get("/dashboard", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const postCount = posts?.length || 0;
    const scheduledCount = posts?.filter((p: any) => new Date(p.schedule_time) > new Date()).length || 0;
    const publishedCount = posts?.filter((p: any) => isPublished(p)).length || 0;

    // Platform distribution (based on target platforms)
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

    // Per-platform ("bot") detailed stats
    const botStats: Record<string, {
      totalTargeted: number;
      published: number;
      failed: number;
      pending: number;
      lastPublished: string | null;
    }> = {};

    for (const p of posts || []) {
      const platforms = typeof p.platforms === "string" ? p.platforms.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];
      const results = parseResults(p.publish_results);

      for (const pf of platforms) {
        if (!botStats[pf]) botStats[pf] = { totalTargeted: 0, published: 0, failed: 0, pending: 0, lastPublished: null };
        botStats[pf].totalTargeted++;

        const result = results.find((r) => r.platform === pf);
        if (result) {
          if (result.success) {
            botStats[pf].published++;
            const ct = p.created_at;
            if (ct && (!botStats[pf].lastPublished || ct > botStats[pf].lastPublished)) botStats[pf].lastPublished = ct;
          } else {
            botStats[pf].failed++;
          }
        } else {
          botStats[pf].pending++;
        }
      }
    }

    const { data: accounts } = await supabase.rpc("get_connected_accounts", { p_user_id: userId });
    const connectedPlatforms = (accounts as any[] || []).map((a: any) => a.platform);

    // Connected accounts with user names
    const connectedAccountDetails = (accounts as any[] || []).map((a: any) => ({
      platform: a.platform,
      name: a.platform_user_name || null,
      connectedAt: a.created_at,
    }));

    const recentPosts = (posts || []).slice(0, 5).map((p: any) => ({
      caption: p.caption?.substring(0, 80),
      platforms: typeof p.platforms === "string" ? p.platforms.split(",") : p.platforms || [],
      created_at: p.created_at,
      schedule_time: p.schedule_time,
      status: isPublished(p) ? "published" : "scheduled",
    }));

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
        botStats,
        connectedAccounts: connectedAccountDetails,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
