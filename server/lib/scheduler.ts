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

async function checkDuePosts() {
  try {
    const now = new Date().toISOString();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .lt("schedule_time", now)
      .is("publish_results", null)
      .limit(20);

    if (error) {
      console.error("[Scheduler] Query error:", error.message);
      return;
    }

    if (!posts || posts.length === 0) return;

    console.log(`[Scheduler] Found ${posts.length} due post(s)`);

    for (const post of posts) {
      try {
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

        console.log(`[Scheduler] Publishing post ${post.id}...`);
        await publishPost(post.id, post.user_id, post.caption || "", platforms, mediaUrls);
        console.log(`[Scheduler] Post ${post.id} published`);
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
