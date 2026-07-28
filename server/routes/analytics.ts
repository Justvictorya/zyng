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

function parseResults(raw: any): { platform: string; success: boolean; error?: string }[] {
  try {
    const pr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(pr)) return pr;
  } catch {}
  return [];
}

router.get("/dashboard", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const range = req.query.range as string || "30d";
  let dateFilter: string | null = null;
  if (range !== "all") {
    const days = parseInt(range.replace("d", ""), 10);
    if (!isNaN(days)) {
      dateFilter = new Date(Date.now() - days * 86400000).toISOString();
    }
  }

  try {
    let query = supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (dateFilter) {
      query = query.gte("created_at", dateFilter);
    }
    const { data: posts } = await query;

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

router.get("/posting-insights", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, caption, platforms, schedule_time, created_at, publish_results, engagement_data, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!posts || posts.length === 0) {
      return res.json({
        success: true,
        insights: {
          platforms: {},
          bestDayHour: { day: null, hour: null },
          totalPosts: 0,
        },
      });
    }

    // Per-platform analysis
    const platformStats: Record<string, {
      lastPostAt: string | null;
      totalPosts: number;
      publishedCount: number;
      postsByHour: Record<number, number>;
      postsByDay: Record<number, number>;
      totalEngagement: number;
      bestHour: number | null;
      bestDay: number | null;
      avgEngagement: number;
      topPost: { id: string; caption: string; engagement: number; date: string } | null;
    }> = {};

    const allDays: Record<number, number> = {};
    const allHours: Record<number, number> = {};

    for (const post of posts) {
      const platforms = typeof post.platforms === "string"
        ? post.platforms.split(",").map((p: string) => p.trim().toLowerCase()).filter(Boolean)
        : [];

      const isPublished = post.status === "published" ||
        (post.publish_results && (() => {
          try {
            const pr = typeof post.publish_results === "string" ? JSON.parse(post.publish_results) : post.publish_results;
            return Array.isArray(pr) && pr.some((r: any) => r.success);
          } catch { return false; }
        })());

      const postDate = new Date(post.schedule_time || post.created_at);
      const hour = postDate.getHours();
      const day = postDate.getDay();

      allDays[day] = (allDays[day] || 0) + 1;
      allHours[hour] = (allHours[hour] || 0) + 1;

      let totalEng = 0;
      const engData = post.engagement_data
        ? (typeof post.engagement_data === "string" ? JSON.parse(post.engagement_data) : post.engagement_data)
        : {};

      for (const eng of Object.values(engData) as any[]) {
        totalEng += (eng.likes || 0) + (eng.comments || 0) + (eng.shares || 0);
      }

      for (const pf of platforms) {
        if (!platformStats[pf]) {
          platformStats[pf] = {
            lastPostAt: null,
            totalPosts: 0,
            publishedCount: 0,
            postsByHour: {},
            postsByDay: {},
            totalEngagement: 0,
            bestHour: null,
            bestDay: null,
            avgEngagement: 0,
            topPost: null,
          };
        }

        const stat = platformStats[pf];
        stat.totalPosts++;
        if (isPublished) stat.publishedCount++;

        if (!stat.lastPostAt || post.created_at > stat.lastPostAt) {
          stat.lastPostAt = post.created_at;
        }

        stat.postsByHour[hour] = (stat.postsByHour[hour] || 0) + 1;
        stat.postsByDay[day] = (stat.postsByDay[day] || 0) + 1;
        stat.totalEngagement += totalEng;

        const engScore = totalEng;
        if (!stat.topPost || engScore > stat.topPost.engagement) {
          stat.topPost = {
            id: post.id,
            caption: (post.caption || "").substring(0, 80),
            engagement: engScore,
            date: post.created_at,
          };
        }
      }
    }

    // Calculate best hour/day per platform
    for (const [pf, stat] of Object.entries(platformStats)) {
      stat.avgEngagement = stat.totalPosts > 0 ? Math.round(stat.totalEngagement / stat.totalPosts) : 0;

      let maxHour = 0, maxHourCount = 0;
      for (const [h, c] of Object.entries(stat.postsByHour)) {
        if (c > maxHourCount) { maxHourCount = c; maxHour = parseInt(h); }
      }
      stat.bestHour = maxHourCount > 0 ? maxHour : null;

      let maxDay = 0, maxDayCount = 0;
      for (const [d, c] of Object.entries(stat.postsByDay)) {
        if (c > maxDayCount) { maxDayCount = c; maxDay = parseInt(d); }
      }
      stat.bestDay = maxDayCount > 0 ? maxDay : null;
    }

    // Overall best day/hour
    let bestOverallDay: number | null = null;
    let bestOverallHour: number | null = null;
    let maxDayTotal = 0;
    let maxHourTotal = 0;
    for (const [d, c] of Object.entries(allDays)) {
      if (c > maxDayTotal) { maxDayTotal = c; bestOverallDay = parseInt(d); }
    }
    for (const [h, c] of Object.entries(allHours)) {
      if (c > maxHourTotal) { maxHourTotal = c; bestOverallHour = parseInt(h); }
    }

    return res.json({
      success: true,
      insights: {
        platforms: platformStats,
        bestDayHour: { day: bestOverallDay, hour: bestOverallHour },
        totalPosts: posts.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
