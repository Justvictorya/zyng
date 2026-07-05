import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { getPublishResults } from "../lib/scheduler";

const router = Router();

function isPublished(post: any): boolean {
  const mem = getPublishResults(post.id);
  if (mem && mem.length > 0) return mem.some((r) => r.success);
  try {
    const pr = typeof post.publish_results === "string" ? JSON.parse(post.publish_results) : post.publish_results;
    if (Array.isArray(pr)) return pr.some((r: any) => r.success);
  } catch {}
  return false;
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

    // Per-platform publisher detailed stats
    const botStats: Record<string, {
      totalTargeted: number;
      published: number;
      failed: number;
      pending: number;
      lastPublished: string | null;
      successRate: number;
      posts: Array<{
        id: string;
        caption: string;
        created_at: string;
        status: "published" | "failed" | "pending";
        error?: string | null;
      }>;
    }> = {};

    for (const p of posts || []) {
      const platforms = typeof p.platforms === "string" ? p.platforms.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean) : [];
      const results = parseResults(p.publish_results);

      for (const pf of platforms) {
        if (!botStats[pf]) botStats[pf] = { totalTargeted: 0, published: 0, failed: 0, pending: 0, lastPublished: null, successRate: 0, posts: [] };
        botStats[pf].totalTargeted++;

        const result = results.find((r) => r.platform === pf);
        if (result) {
          const status = result.success ? "published" : "failed";
          if (result.success) {
            botStats[pf].published++;
            const ct = p.created_at;
            if (ct && (!botStats[pf].lastPublished || ct > botStats[pf].lastPublished)) botStats[pf].lastPublished = ct;
          } else {
            botStats[pf].failed++;
          }
          botStats[pf].posts.push({
            id: p.id,
            caption: p.caption?.substring(0, 200),
            created_at: p.created_at,
            status,
            error: result.error || null,
          });
        } else {
          botStats[pf].pending++;
          botStats[pf].posts.push({
            id: p.id,
            caption: p.caption?.substring(0, 200),
            created_at: p.created_at,
            status: "pending",
            error: null,
          });
        }
      }
    }

    // Calculate success rate per bot
    for (const key of Object.keys(botStats)) {
      const b = botStats[key];
      b.successRate = b.totalTargeted > 0 ? Math.round((b.published / b.totalTargeted) * 100) : 0;
      // Sort posts newest first
      b.posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

router.get("/export", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const rows = (posts || []).map((p: any) => {
      const results = parseResults(p.publish_results);
      return {
        "Created At": p.created_at,
        "Scheduled Time": p.schedule_time,
        Caption: (p.caption || "").replace(/"/g, '""'),
        Platforms: p.platforms || "",
        Status: isPublished(p) ? "Published" : new Date(p.schedule_time) > new Date() ? "Scheduled" : "Pending",
        "Publish Results": results.map((r: any) => `${r.platform}:${r.success ? "OK" : "FAIL"}`).join("; "),
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((row: any) => headers.map((h) => `"${(row[h] || "").toString()}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=zyng-analytics-${new Date().toISOString().split("T")[0]}.csv`);
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
