import { supabase, serviceDb } from "./supabase";
import { publishPost } from "./publisher";

const INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

interface PublishResult {
  platform: string;
  success: boolean;
}
// In-memory tracking for publish results (also persisted to DB when column exists)
const publishedResults = new Map<string, PublishResult[]>();

export async function startScheduler() {
  if (intervalHandle) return;
  console.log("[Scheduler] Starting — checks every 60s for due posts");

  // Release any stale processing locks from previous runs
  const stale = new Date(Date.now() - 120_000).toISOString();
  await serviceDb.from("posts").update({ processing_at: null }).lt("processing_at", stale).then((r) => {
    if (r.error) console.error("[Scheduler] Failed to clear stale locks:", r.error.message);
  });

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
    // Pick posts past their schedule time that are not currently being processed
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .lt("schedule_time", now)
      .is("processing_at", null)
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

        // Determine already-published platforms from DB or in-memory
        let published: string[] = [];
        const dbPr = parseField(post.publish_results);
        if (Array.isArray(dbPr)) {
          published = dbPr.map((r: any) => r.platform);
        } else {
          const mem = publishedResults.get(post.id);
          if (mem) published = mem.map((r) => r.platform);
        }

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

        // Atomically claim this post so no other scheduler tick processes it
        const lockTime = new Date().toISOString();
        const staleThreshold = new Date(Date.now() - 120_000).toISOString();
        const { data: locked } = await serviceDb
          .from("posts")
          .update({ processing_at: lockTime })
          .eq("id", post.id)
          .or(`processing_at.lt.${staleThreshold},processing_at.is.null`)
          .select("id")
          .single();

        if (!locked) {
          console.debug(`[Scheduler] Post ${post.id} skipped (processing_at: ${post.processing_at})`);
          continue;
        }

        console.log(`[Scheduler] Publishing post ${post.id} (${toPublish.length}/${allPlatforms.length} platforms)`);

        const results = await publishPost(
          post.id, post.user_id, post.caption || "",
          toPublish, mediaUrls, platformCaptions
        );

        // Store in-memory + persist to DB
        const existing = parseField(post.publish_results);
        const dbExisting: PublishResult[] = Array.isArray(existing) ? existing : (publishedResults.get(post.id) || []);
        const updatedResults = [...dbExisting, ...results];
        publishedResults.set(post.id, updatedResults);

        try {
          await serviceDb
            .from("posts")
            .update({
              publish_results: JSON.stringify(updatedResults),
              processing_at: null,
            })
            .eq("id", post.id);
        } catch (e: any) { console.error(`[Scheduler] Persist error for post ${post.id}:`, e?.message); }

        console.log(`[Scheduler] Post ${post.id} — ${updatedResults.length}/${allPlatforms.length} platforms done`);
      } catch (err: any) {
        console.error(`[Scheduler] Post ${post.id} failed:`, err.message);
        // Release lock on error so it can be retried
        try { await serviceDb.from("posts").update({ processing_at: null }).eq("id", post.id); } catch {}
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
