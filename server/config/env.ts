import dotenv from "dotenv";
dotenv.config();

// Snapshot env vars at load time (Railway may alter process.env later)
export const ENV_SNAPSHOT: Record<string, string> = {};
function capture(key: string) {
  ENV_SNAPSHOT[key] = process.env[key] || "";
}
capture("TWITTER_CLIENT_ID");
capture("TWITTER_CLIENT_SECRET");

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
] as const;

const OAUTH_VARS = [
  "TIKTOK_CLIENT_ID",
  "TIKTOK_CLIENT_SECRET",
  "FACEBOOK_CLIENT_ID",
  "FACEBOOK_CLIENT_SECRET",
  "INSTAGRAM_CLIENT_ID",
  "INSTAGRAM_CLIENT_SECRET",
  "TWITTER_CLIENT_ID",
  "TWITTER_CLIENT_SECRET",
  "LINKEDIN_CLIENT_ID",
  "LINKEDIN_CLIENT_SECRET",
  "WHATSAPP_CLIENT_ID",
  "WHATSAPP_CLIENT_SECRET",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
] as const;

const PAYSTACK_VARS = [
  "PAYSTACK_PUBLIC_KEY",
  "PAYSTACK_SECRET_KEY",
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("Running in dev mode — some features may not work.");
    }
  }
}

function env(key: string, fallback?: string): string {
  return (process.env[key] || fallback || "").replace(/\s/g, "");
}

export { validateEnv, env, ENV_SNAPSHOT, REQUIRED_VARS, OAUTH_VARS };
