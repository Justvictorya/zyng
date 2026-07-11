import { supabase, serviceDb } from "./supabase";
import { env } from "../config/env";

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

  const { data: accounts } = await serviceDb
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId);

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
    case "whatsapp":
      return publishToWhatsApp(account, caption, mediaUrls);
    default:
      return { platform, success: false, error: `Unsupported platform: ${platform}` };
  }
}

async function refreshToken(platform: string, account: any): Promise<string | null> {
  const refresh = account.refresh_token;
  if (!refresh) return null;

  const clientId = env(`${platform.toUpperCase()}_CLIENT_ID`);
  const clientSecret = env(`${platform.toUpperCase()}_CLIENT_SECRET`);

  try {
    let tokenUrl: string;
    let body: Record<string, string>;
    let headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };

    switch (platform) {
      case "facebook":
      case "instagram":
      case "whatsapp":
        tokenUrl = "https://graph.facebook.com/v22.0/oauth/access_token";
        body = {
          grant_type: "fb_exchange_token",
          client_id: clientId,
          client_secret: clientSecret,
          fb_exchange_token: account.access_token,
        };
        break;
      case "twitter":
        tokenUrl = "https://api.twitter.com/2/oauth2/token";
        body = { grant_type: "refresh_token", refresh_token: refresh };
        headers["Authorization"] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
        break;
      case "tiktok":
        tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
        body = {
          grant_type: "refresh_token",
          refresh_token: refresh,
          client_key: clientId,
          client_secret: clientSecret,
        };
        break;
      case "linkedin":
        tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
        body = {
          grant_type: "refresh_token",
          refresh_token: refresh,
          client_id: clientId,
          client_secret: clientSecret,
        };
        break;
      case "youtube":
        tokenUrl = "https://oauth2.googleapis.com/token";
        body = {
          grant_type: "refresh_token",
          refresh_token: refresh,
          client_id: clientId,
          client_secret: clientSecret,
        };
        break;
      default:
        return null;
    }

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(body),
    });
    const data = await res.json();
    if (data.access_token) {
      await supabase
        .from("connected_accounts")
        .update({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refresh,
          token_expires_at: data.expires_in
            ? new Date(Date.now() + data.expires_in * 1000).toISOString()
            : null,
        })
        .eq("id", account.id);
      return data.access_token;
    }
  } catch (e) {
    console.warn(`[Publisher] Token refresh failed for ${platform}:`, e);
  }
  return null;
}

async function publishToFacebook(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const postToFb = async (token: string) => {
    const r = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, access_token: token }),
    });
    return r.json();
  };

  let data = await postToFb(account.access_token);
  if (data.error?.code === 190 || data.error?.error_subcode === 463) {
    const refreshed = await refreshToken("facebook", account);
    if (refreshed) data = await postToFb(refreshed);
  }

  if (data.error) return { platform: "facebook", success: false, error: data.error.message };
  return { platform: "facebook", success: true, postId: data.id };
}

async function publishToInstagram(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  if (mediaUrls.length === 0) {
    return { platform: "instagram", success: false, error: "Instagram requires media" };
  }

  const postMedia = async (token: string) => {
    const createRes = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: mediaUrls[0], caption, access_token: token }),
    });
    const createData = await createRes.json();
    if (createData.error) return createData;

    const publishRes = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    });
    return publishRes.json();
  };

  let data = await postMedia(account.access_token);
  if (data.error?.code === 190 || data.error?.error_subcode === 463) {
    const refreshed = await refreshToken("instagram", account);
    if (refreshed) data = await postMedia(refreshed);
  }

  if (data.error) return { platform: "instagram", success: false, error: data.error.message };
  return { platform: "instagram", success: true, postId: data.id };
}

async function publishToTikTok(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  if (mediaUrls.length === 0) {
    return { platform: "tiktok", success: false, error: "TikTok requires a video" };
  }

  const videoUrl = mediaUrls.find((u) => u.match(/\.(mp4|mov|avi|webm)$/i)) || mediaUrls[0];

  const postVideo = async (token: string) => {
    const r = await fetch("https://open.tiktokapis.com/v2/video/upload/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ source: "pull", video_url: videoUrl, post_info: { title: caption, privacy_level: "PUBLIC" } }),
    });
    return r.json();
  };

  let data = await postVideo(account.access_token);
  if (data.error?.code === 401 || data.error?.code === "token_expired") {
    const refreshed = await refreshToken("tiktok", account);
    if (refreshed) data = await postVideo(refreshed);
  }

  if (data.error) return { platform: "tiktok", success: false, error: data.error.message || JSON.stringify(data.error) };
  return { platform: "tiktok", success: true, postId: data.data?.publish_id };
}

async function publishToTwitter(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const postTweet = async (token: string) => {
    const body: any = { text: caption };
    const r = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  };

  let { status, body: data } = await postTweet(account.access_token);
  console.log(`[Twitter] Attempt post with stored token — status: ${status}, response:`, JSON.stringify(data));

  if (status === 401 || data.title === "Unauthorized") {
    console.log("[Twitter] Token expired, attempting refresh...");
    const refreshed = await refreshToken("twitter", account);
    if (refreshed) {
      console.log("[Twitter] Token refreshed, retrying post...");
      const res = await postTweet(refreshed);
      status = res.status;
      data = res.body;
      console.log(`[Twitter] Retry post — status: ${status}, response:`, JSON.stringify(data));
    } else {
      console.log("[Twitter] Token refresh failed — no refresh_token or refresh endpoint rejected");
    }
  }

  if (status !== 201 || !data?.data?.id) {
    const err = data?.detail || data?.errors?.[0]?.detail || data?.title || "Unknown Twitter API error";
    console.error(`[Twitter] Publish failed — status: ${status}, error: ${err}`);
    return { platform: "twitter", success: false, error: err };
  }
  console.log(`[Twitter] Publish success — tweet id: ${data.data.id}`);
  return { platform: "twitter", success: true, postId: data.data.id };
}

async function publishToLinkedIn(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const postLi = async (token: string) => {
    const r = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
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
    return r.json();
  };

  let data = await postLi(account.access_token);
  if (data.status === 401 || data.error?.code === 401) {
    const refreshed = await refreshToken("linkedin", account);
    if (refreshed) data = await postLi(refreshed);
  }

  if (data.error) return { platform: "linkedin", success: false, error: data.error.message };
  return { platform: "linkedin", success: true, postId: data.id };
}

async function publishToWhatsApp(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const postWp = async (token: string) => {
    const phoneRes = await fetch(`https://graph.facebook.com/v22.0/${account.platform_user_id}/whatsapp_business_messaging?fields=phone_numbers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const phoneData = await phoneRes.json();
    const phoneNumberId = phoneData?.phone_numbers?.[0]?.id;
    if (!phoneNumberId) return { error: { message: "No WhatsApp Business phone number found" } };

    const body: any = {
      messaging_product: "whatsapp",
      recipient_type: "broadcast",
      to: phoneNumberId,
      type: "text",
      text: { preview_url: false, body: caption },
    };

    const r = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  let data = await postWp(account.access_token);
  if (data.error?.code === 190 || data.error?.error_subcode === 463) {
    const refreshed = await refreshToken("whatsapp", account);
    if (refreshed) data = await postWp(refreshed);
  }

  if (data.error) return { platform: "whatsapp", success: false, error: data.error.message };
  return { platform: "whatsapp", success: true, postId: data.messages?.[0]?.id };
}

async function publishToYouTube(account: any, caption: string, mediaUrls: string[]): Promise<PublishResult> {
  const videoUrl = mediaUrls.find((u) => u.match(/\.(mp4|mov|avi|webm|mkv)$/i)) || mediaUrls[0];
  if (!videoUrl) {
    return { platform: "youtube", success: false, error: "YouTube requires a video file" };
  }

  const postYt = async (token: string) => {
    const body = {
      snippet: { title: caption.substring(0, 100), description: caption },
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
    };
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    const insertRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      { method: "POST", headers, body: JSON.stringify(body) }
    );

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({}));
      return { error: { message: err.error?.message || insertRes.statusText, status: insertRes.status } };
    }

    const uploadUrl = insertRes.headers.get("location");
    if (!uploadUrl) return { error: { message: "No upload URL returned from YouTube" } };

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) return { error: { message: "Failed to fetch video from URL" } };
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/*", "Content-Length": String(videoBuffer.length) },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "");
      return { error: { message: errText || uploadRes.statusText } };
    }

    const uploadData = await uploadRes.json().catch(() => ({}));
    return { data: uploadData, id: uploadData.id };
  };

  let result = await postYt(account.access_token);
  if (result.error?.status === 401) {
    const refreshed = await refreshToken("youtube", account);
    if (refreshed) result = await postYt(refreshed);
  }

  if (result.error) return { platform: "youtube", success: false, error: result.error.message };
  return { platform: "youtube", success: true, postId: result.id };
}
