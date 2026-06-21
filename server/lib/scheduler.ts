import { supabase } from "./supabase";
import { publishPost } from "./publisher";

const INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startScheduler() {
  if (intervalHandle) return;
  console.log("[Scheduler] Starting — checks every 60s for due posts");
  intervalHandle = setInterval(checkDuePosts, INTERVAL_MS);
  checkDuePosts();
}

interface PublishResult {
  platform: string;
  success: boolean;
}

function parseJson(raw: any): any {
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return null; }
}

function getPublishedPlatforms(post: any): string[] {
  const pr = parseJson(post.publish_results);
  if (Array.isArray(pr)) return pr.map((r: any) => r.platform);
  return [];
}

async function checkDuePosts() {
  try {
    const now = new Date().toISOString();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .lt("schedule_time", now)
      .limit(50);

    if (error) {
      console.error("[Scheduler] Query error:", error.message);
      return;
    }

    if (!posts || posts.length === 0) return;

    for (const post of posts) {
      try {
        const allPlatforms = typeof post.platforms === "string"
          ? post.platforms.split(",").map((p: string) => p.trim()).filter(Boolean)
          : post.platforms || [];

        const published = getPublishedPlatforms(post);
        const remaining = allPlatforms.filter((p: string) => !published.includes(p));

        if (remaining.length === 0) continue;

        const platformSchedule: Record<string, string> = parseJson(post.platform_schedule) || {};
        const hasPerPlatformSchedule = Object.keys(platformSchedule).length > 0;

        let toPublish: string[];

        if (hasPerPlatformSchedule) {
          toPublish = remaining.filter((p: string) => {
            const t = platformSchedule[p];
            return t && new Date(t) <= new Date();
          });
        } else {
          toPublish = remaining;
        }

        if (toPublish.length === 0) continue;

        const mediaUrls: string[] = [];
        const parsedMedia = parseJson(post.media_urls);
        if (Array.isArray(parsedMedia)) mediaUrls.push(...parsedMedia);

        const platformCaptions: Record<string, string> | undefined = parseJson(post.platform_captions) || undefined;

        console.log(`[Scheduler] Publishing post ${post.id} to [${toPublish.join(",")}]${hasPerPlatformSchedule ? " (per-platform schedule)" : ""}`);

        const results = await publishPost(
          post.id, post.user_id, post.caption || "",
          toPublish, mediaUrls, platformCaptions
        );

        const allResults = [...published, ...results.map((r) => ({ platform: r.platform, success: r.success }))];

        await supabase
          .from("posts")
          .update({ publish_results: JSON.stringify(allResults) })
          .eq("id", post.id);

        console.log(`[Scheduler] Post ${post.id} — ${allResults.length}/${allPlatforms.length} platforms done`);
      } catch (err: any) {
        console.error(`[Scheduler] Post ${post.id} failed:`, err.message);
      }
    }
  } catch (err: any) {
    console.error("[Scheduler] Error:", err.message);
  }
}

export function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
