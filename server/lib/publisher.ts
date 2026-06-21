import { supabase } from "./supabase";
import { env } from "../config/env";

const FACEBOOK_CLIENT_ID = env("FACEBOOK_CLIENT_ID");
const FACEBOOK_CLIENT_SECRET = env("FACEBOOK_CLIENT_SECRET");

interface PublishResult {
  platform: string;
  success: boolean;
  error?: string;
  postId?: string;
}

export async function publishPost(
  postId: string,
  userId: string,
  defaultCaption: string,
  platforms: string[],
  mediaUrls: string[],
  platformCaptions?: Record<string, string>
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  const { data: accounts } = await supabase.rpc("get_connected_accounts", {
    p_user_id: userId,
  });

  const connected = (accounts as any[] || []).filter((a: any) =>
    platforms.includes(a.platform)
  );

  for (const platform of platforms) {
    const account = connected.find((a: any) => a.platform === platform);
    if (!account) {
      results.push({ platform, success: false, error: "Account not connected" });
      continue;
    }

    const caption = platformCaptions?.[platform] || defaultCaption;

    try {
      const result = await publishToPlatform(platform, account, caption, mediaUrls);
      results.push(result);
    } catch (err: any) {
      results.push({ platform, success: false, error: err.message });
    }
  }

  return results;
}

async function publishToPlatform(
  platform: string,
  account: any,
  caption: string,
  mediaUrls: string[]
): Promise<PublishResult> {
  switch (platform) {
    case "facebook":
      return publishToFacebook(account, caption, mediaUrls);
    case "instagram":
      return publishToInstagram(account, caption, mediaUrls);
    case "tiktok":
      return publishToTikTok(account, caption, mediaUrls);
    case "twitter":
      return publishToTwitter(account, caption, mediaUrls);
    case "linkedin":
      return publishToLinkedIn(account, caption, mediaUrls);
    case "youtube":
      return publishToYouTube(account, caption, mediaUrls);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}

async function refreshFacebookToken(account: any): Promise<string | null> {
  if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${account.access_token}`
    );
    const data = await res.json();
    if (data.access_token) {
      await supabase
        .from("connected_accounts")
        .update({ access_token: data.access_token })
        .eq("id", account.id);
      return data.access_token;
    }
  } catch {}
  return null;
}

async function publishToFacebook(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  let token = account.access_token;

  const postToFb = async (t: string) => {
    const r = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, access_token: t }),
    });
    return r.json();
  };

  let data = await postToFb(token);
  if (data.error?.code === 190 || data.error?.error_subcode === 463) {
    const refreshed = await refreshFacebookToken(account);
    if (refreshed) {
      token = refreshed;
      data = await postToFb(token);
    }
  }

  if (data.error) return { platform: "facebook", success: false, error: data.error.message };
  return { platform: "facebook", success: true, postId: data.id };
}

async function publishToInstagram(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  if (mediaUrls.length > 0) {
    const createRes = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: mediaUrls[0],
        caption,
        access_token: account.access_token,
      }),
    });
    const createData = await createRes.json();
    if (createData.error) return { platform: "instagram", success: false, error: createData.error.message };

    const publishRes = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: createData.id,
        access_token: account.access_token,
      }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) return { platform: "instagram", success: false, error: publishData.error.message };
    return { platform: "instagram", success: true, postId: publishData.id };
  }

  return { platform: "instagram", success: false, error: "Instagram requires media" };
}

async function publishToTikTok(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  if (mediaUrls.length === 0) {
    return { platform: "tiktok", success: false, error: "TikTok requires a video" };
  }

  const videoUrl = mediaUrls.find((u) => u.match(/\.(mp4|mov|avi|webm)$/i)) || mediaUrls[0];

  const initRes = await fetch("https://open.tiktokapis.com/v2/video/upload/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "pull",
      video_url: videoUrl,
      post_info: { title: caption, privacy_level: "PUBLIC" },
    }),
  });
  const initData = await initRes.json();
  if (initData.error) return { platform: "tiktok", success: false, error: initData.error.message };
  return { platform: "tiktok", success: true, postId: initData.data?.publish_id };
}

async function publishToTwitter(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const body: any = { text: caption };
  if (mediaUrls.length > 0) {
    body.media = { media_ids: mediaUrls };
  }
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.errors) return { platform: "twitter", success: false, error: data.errors[0]?.message };
  return { platform: "twitter", success: true, postId: data.data?.id };
}

async function publishToLinkedIn(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${account.platform_user_id}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: caption },
          shareMediaCategory: mediaUrls.length > 0 ? "IMAGE" : "NONE",
          media: mediaUrls.map((url) => ({ status: "READY", media: url })),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = await res.json();
  if (data.error) return { platform: "linkedin", success: false, error: data.error.message };
  return { platform: "linkedin", success: true, postId: data.id };
}

async function publishToYouTube(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  return { platform: "youtube", success: false, error: "YouTube upload requires OAuth 2.0 with refresh token — not yet implemented" };
}
