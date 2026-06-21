import { supabase, serviceDb } from "./supabase";
import { publishPost } from "./publisher";

const INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

interface PublishResult {
  platform: string;
  success: boolean;
}
// In-memory tracking for publish results (the publish_results column doesn't exist in the DB)
const publishedResults = new Map<string, PublishResult[]>();

function getPublishedPlatforms(postId: string): string[] {
  const pr = publishedResults.get(postId);
  if (pr) return pr.map((r) => r.platform);
  return [];
}

export function startScheduler() {
  if (intervalHandle) return;
  console.log("[Scheduler] Starting — checks every 60s for due posts");
  intervalHandle = setInterval(checkDuePosts, INTERVAL_MS);
  checkDuePosts();
}

function parseField(raw: any): any {
  if (raw == null) return null;
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return null; }
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
      // Skip if we already processed this post in this session
      if (publishedResults.has(post.id)) {
        const allDone = publishedResults.get(post.id)!.length >= (post.platforms?.split(",").length || 0);
        if (allDone) continue;
      }

      try {
        const allPlatforms = typeof post.platforms === "string"
          ? post.platforms.split(",").map((p: string) => p.trim()).filter(Boolean)
          : post.platforms || [];

        const published = getPublishedPlatforms(post.id);
        const remaining = allPlatforms.filter((p: string) => !published.includes(p));

        if (remaining.length === 0) continue;

        const platformSchedule: Record<string, string> = parseField(post.platform_schedule) || {};
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
        const parsedMedia = parseField(post.media_urls);
        if (Array.isArray(parsedMedia)) mediaUrls.push(...parsedMedia);

        const platformCaptions: Record<string, string> | undefined = parseField(post.platform_captions) || undefined;

        console.log(`[Scheduler] Publishing post ${post.id} to [${toPublish.join(",")}]`);

        const results = await publishPost(
          post.id, post.user_id, post.caption || "",
          toPublish, mediaUrls, platformCaptions
        );

        // Store in-memory
        const existing = publishedResults.get(post.id) || [];
        const updatedResults = [...existing, ...results];
        publishedResults.set(post.id, updatedResults);

        const allDone = updatedResults.length >= allPlatforms.length;

        if (allDone) {
          // Mark as processed so DB query won't re-select after restart
          await serviceDb
            .from("posts")
            .update({ schedule_time: "2099-01-01T00:00:00Z" })
            .eq("id", post.id)
            .catch((err: any) => console.error(`[Scheduler] Failed to mark post ${post.id} done:`, err.message));
        }

        console.log(`[Scheduler] Post ${post.id} — ${updatedResults.length}/${allPlatforms.length} platforms done`);
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

export function getPublishResults(postId: string): PublishResult[] | null {
  return publishedResults.get(postId) || null;
}

export function recordPublishResults(postId: string, results: PublishResult[]) {
  const existing = publishedResults.get(postId) || [];
  publishedResults.set(postId, [...existing, ...results]);
}
