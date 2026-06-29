import { env } from "./env";

interface OAuthPlatform {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scope: string;
  profileUrl: string;
  profileParser: (data: any) => { platformUserId: string; platformUserName: string };
  needsPkce?: boolean;
  useClientKey?: boolean;
  extraAuthorizeParams?: string;
}

export const OAUTH_CONFIG: Record<string, OAuthPlatform> = {
  facebook: {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scope: "pages_manage_posts,pages_read_engagement,pages_show_list,business_management,public_profile",
    profileUrl: "https://graph.facebook.com/me?fields=id,name",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
  },
  instagram: {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    scope: "instagram_basic,instagram_content_publish,pages_show_list,business_management,public_profile",
    profileUrl: "https://graph.instagram.com/me?fields=id,username",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.username || data.name }),
  },
  tiktok: {
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientIdEnv: "TIKTOK_CLIENT_ID",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    scope: "user.info.basic",
    profileUrl: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",
    profileParser: (data: any) => ({ platformUserId: data.open_id, platformUserName: data.display_name }),
    needsPkce: true,
    useClientKey: true,
  },
  twitter: {
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientIdEnv: "TWITTER_CLIENT_ID",
    clientSecretEnv: "TWITTER_CLIENT_SECRET",
    scope: "tweet.read tweet.write users.read offline.access",
    profileUrl: "https://api.twitter.com/2/users/me",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
  },
  linkedin: {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    scope: "w_member_social,openid,profile",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    profileParser: (data: any) => ({ platformUserId: data.sub, platformUserName: data.name }),
  },
  whatsapp: {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientIdEnv: "WHATSAPP_CLIENT_ID",
    clientSecretEnv: "WHATSAPP_CLIENT_SECRET",
    scope: "whatsapp_business_messaging,pages_show_list",
    profileUrl: "https://graph.facebook.com/me?fields=id,name",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
  },
  youtube: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
    extraAuthorizeParams: "access_type=offline&prompt=consent",
  },
};

export function oauthRedirectUri(req: any, platform: string): string {
  const host = req.get("host") || "localhost:3000";
  const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}/api/v1/oauth/${platform}/callback`;
}

export function getOauthClientId(platform: string): string | null {
  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return null;
  return env(cfg.clientIdEnv) || null;
}
