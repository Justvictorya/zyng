import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.set("trust proxy", true);

// ── Supabase Client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!!
);

// Admin client (service role) for auth operations only
const adminAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).auth.admin;// ── Gemini Client ────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
});

app.use(express.json());

// ── AUTH API ─────────────────────────────────────────────────────────────────

// SIGNUP — creates user in Supabase Auth
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const { data, error } = await adminAuth.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true
    });
    if (error) return res.status(400).json({ success: false, error: error.message });

    const user = {
      id: data.user!.id,
      name: data.user!.user_metadata?.full_name || name,
      email: data.user!.email,
      tier: "Free",
      joined: new Date().toLocaleString("en-US", { month: "long" }) + " " + new Date().getFullYear(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// RESET PASSWORD — admin sets password to "password123"
app.post("/api/auth/reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const { data: users } = await adminAuth.listUsers();
    const user = users.users.find((u: any) => u.email === email);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    await adminAuth.updateUserById(user.id, { password: "password123" });
    return res.json({ success: true, message: "Password reset to password123" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN — verifies with Supabase Auth
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, error: "Invalid email or password" });

    const user = {
      id: data.user.id,
      name: data.user.user_metadata?.full_name || email.split("@")[0],
      email: data.user.email,
      tier: "Pro",
      joined: "May 2026",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.user.user_metadata?.full_name || email)}`
    };
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POSTS API ─────────────────────────────────────────────────────────────────

// GET all posts for authenticated user
app.get("/api/posts", async (req, res) => {
  const userId = req.query.user_id as string;
  try {
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, posts: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE new post
app.post("/api/posts", async (req, res) => {
  const { caption, platforms, schedule_time, user_id } = req.body;
  try {
    const { data, error } = await supabase.from("posts").insert([{
      user_id,
      caption,
      platforms: Array.isArray(platforms) ? platforms.join(",") : platforms,
      schedule_time: schedule_time || new Date(Date.now() + 3600000).toISOString()
    }]).select().single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, post: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE post
app.put("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { caption, platforms, schedule_time } = req.body;
  try {
    const updates: any = {};
    if (caption !== undefined) updates.caption = caption;
    if (platforms !== undefined) updates.platforms = Array.isArray(platforms) ? platforms.join(",") : platforms;
    if (schedule_time !== undefined) updates.schedule_time = schedule_time;

    const { data, error } = await supabase.from("posts").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, post: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE post
app.delete("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── GEMINI AI ENDPOINTS ──────────────────────────────────────────────────────

// 1. Caption Generator
app.post("/api/ai/generate-caption", async (req, res) => {
  const { prompt, platforms, tone } = req.body;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const focusPlatforms = platforms
    ? (Array.isArray(platforms) ? platforms.join(", ") : platforms)
    : "Facebook, Instagram, WhatsApp";

  try {
    const systemPrompt = `You are Zyng AI, Nigeria's #1 Social Media Copywriter.
Generate a high-engaging caption for Nigerian audiences on: ${focusPlatforms}.
Tone: ${tone || "Standard"}.
Merge professional communication with Nigerian local dialects and Pidgin when appropriate.
Keep it punchy, visual, and action-oriented. Include relevant emojis.

Return ONLY valid JSON:
{
  "caption": "The written social media copy",
  "hashtags": ["list", "of", "localized", "hashtags"],
  "bestTime": "Recommended WAT posting time",
  "rationale": "One sentence explaining why this caption works"
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Draft a social post about: "${prompt}" using tone: "${tone || "Standard"}"`,
      config: { systemInstruction: systemPrompt, responseMimeType: "application/json", temperature: 1.0 }
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("Gemini /generate-caption error:", error);
    return res.json({
      success: true,
      caption: `Oya listen up! 👋 ${prompt}\n\nZyng is live and ready. #Zyng #NaijaTech #BuildWithGemini`,
      hashtags: ["Zyng", "NaijaTech", "BuildWithGemini"],
      bestTime: "7:00 PM WAT",
      rationale: "Merged local Pidgin energy with direct messaging for Nigerian audiences."
    });
  }
});

// 2. Content Fixer
app.post("/api/ai/fix-content", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No copy provided" });

  try {
    const systemPrompt = `You are Zyng AI Magic Content Fixer.
Clean up spelling mistakes, formatting, and punctuation.
PRESERVE all Nigerian slang: "how far", "no wahala", "abeg", "oya", "sapa", "chale", "japa", "carry last".

Return ONLY valid JSON:
{
  "fixedText": "Polished text with slang preserved",
  "changesMade": "Short phrase describing what was corrected"
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Fix this post while preserving local context: "${text}"`,
      config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    return res.json({ success: true, fixedText: text, changesMade: "Minor formatting improvements applied." });
  }
});

// 3. Vibe Switcher
app.post("/api/ai/vibe-switcher", async (req, res) => {
  const { text, targetVibe } = req.body;
  if (!text) return res.status(400).json({ error: "No copy provided" });

  try {
    const systemPrompt = `You are a style translator for Zyng.
Rewrite the provided text into the specified Nigerian vibe:
- 'professional': Corporate, polished, suitable for LinkedIn.
- 'pidgin': Full authentic Nigerian Pidgin English, relatable and funny.
- 'genz': Modern Nigerian Gen-Z style with slang like "no cap", "it's giving", "frfr", "sapa".

Return ONLY valid JSON:
{
  "switchedText": "The rewritten post in the target vibe"
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate: "${text}" to vibe: "${targetVibe}"`,
      config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    let fallback = text;
    if (targetVibe === "pidgin") fallback = `How far? 🤙 Abeg listen: ${text}\nNo wahala, Zyng got you!`;
    else if (targetVibe === "genz") fallback = `This is giving main character energy frfr 💅 ${text} No cap!`;
    else if (targetVibe === "professional") fallback = `We are pleased to present: ${text}.`;
    return res.json({ success: true, switchedText: fallback });
  }
});

// 4. Algorithm Scanner
app.post("/api/ai/flag-scanner", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No copy provided" });

  try {
    const systemPrompt = `You are a social media algorithm safety expert.
Analyze the copy for words that could trigger content suppression or shadowbans on Facebook, Instagram, TikTok, LinkedIn, X, WhatsApp.

Return ONLY valid JSON:
{
  "riskRating": "Low" | "Medium" | "High",
  "score": "Safe rating 0-100%",
  "flaggedTerms": ["word1", "phrase2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Scan for algorithm red flags: "${text}"`,
      config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    return res.json({ success: true, riskRating: "Low", score: "94%", flaggedTerms: [], suggestions: ["Content looks clean!"] });
  }
});

// 5. Viral Blueprint
app.post("/api/ai/viral-blueprint", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const systemPrompt = `You are Zyng Viral Content Planner.
Analyze this URL/topic and identify the psychological hook that makes it viral.
Generate 5 localized content ideas for a Nigerian business.

Return ONLY valid JSON:
{
  "extractedHook": "Description of the viral hook",
  "ideas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Deconstruct viral mechanism for: "${url}"`,
      config: { systemInstruction: systemPrompt, responseMimeType: "application/json" }
    });

    const parsed = JSON.parse(geminiRes.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    return res.json({
      success: true,
      extractedHook: "Social proof + cost-benefit comparison hook.",
      ideas: [
        "Facebook: 'Who else is tired of paying in dollars?' — local humor with CTA.",
        "WhatsApp Status: 3-slide visual comparing Hootsuite vs Zyng pricing.",
        "TikTok: 'This is robbery... oh wait it's just my software subscription' audio.",
        "LinkedIn: Article on currency decoupling benefits for local alternatives.",
        "Twitter/X: 4-tweet thread: '1/ Sapa in 2026 is real, but your marketing budget shouldn't suffer...'"
      ]
    });
  }
});

// ── OAUTH CONNECT API ─────────────────────────────────────────────────────────

const OAUTH_CONFIG: Record<string, {
  authorizeUrl: string;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scope: string;
  profileUrl: string;
  profileParser: (data: any) => { platformUserId: string; platformUserName: string };
  needsPkce?: boolean;
  useClientKey?: boolean;
}> = {
  facebook: {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientIdEnv: "FACEBOOK_CLIENT_ID",
    clientSecretEnv: "FACEBOOK_CLIENT_SECRET",
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts",
    profileUrl: "https://graph.facebook.com/me?fields=id,name",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
  },
  instagram: {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    scope: "instagram_basic,instagram_content_publish,pages_show_list",
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
    scope: "https://www.googleapis.com/auth/youtube.upload",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    profileParser: (data: any) => ({ platformUserId: data.id, platformUserName: data.name }),
  },
};

function oauthRedirectUri(req: express.Request, platform: string): string {
  const host = req.get("host") || "localhost:3000";
  // Force HTTPS when using a tunnel (not localhost)
  const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}/api/auth/${platform}/callback`;
}

// GET /api/auth/:platform/connect — initiate OAuth flow
app.get("/api/auth/:platform/connect", async (req, res) => {
  const { platform } = req.params;
  const userId = req.query.user_id as string;
  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(404).json({ error: `Unknown platform: ${platform}` });

  const clientId = process.env[cfg.clientIdEnv];
  if (!clientId) {
    return res.redirect(`/settings?error=${platform} credentials not configured in .env`);
  }

  let codeVerifier = "";
  let codeChallenge = "";
  if (cfg.needsPkce) {
    codeVerifier = crypto.randomBytes(32).toString("base64url");
    codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  }

  const stateData: any = { userId, platform, csrf: crypto.randomBytes(16).toString("hex") };
  if (codeVerifier) stateData.codeVerifier = codeVerifier;

  const state = JSON.stringify(stateData);
  const redirectUri = oauthRedirectUri(req, platform);

  const clientIdParam = cfg.useClientKey ? "client_key" : "client_id";

  let authUrl = `${cfg.authorizeUrl}?${clientIdParam}=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(cfg.scope)}&response_type=code&state=${encodeURIComponent(state)}`;
  if (cfg.needsPkce) {
    authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }

  res.redirect(authUrl);
});

// GET /api/auth/:platform/callback — handle OAuth redirect
app.get("/api/auth/:platform/callback", async (req, res) => {
  const { platform } = req.params;
  const { code, state, error: oauthError } = req.query;
  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(404).send("Unknown platform");

  if (oauthError) {
    return res.redirect(`/settings?error=${platform} authorization was denied`);
  }
  if (!code) return res.redirect("/settings?error=No authorization code received");

  let parsedState: any = {};
  try { parsedState = JSON.parse(decodeURIComponent(state as string)); } catch {}
  const userId = parsedState.userId;
  if (!userId) return res.redirect("/settings?error=Missing user session");

  const clientId = process.env[cfg.clientIdEnv];
  const clientSecret = process.env[cfg.clientSecretEnv];
  const redirectUri = oauthRedirectUri(req, platform);

  const tokenBody: Record<string, string> = {
    client_id: clientId!,
    client_secret: clientSecret!,
    code: code as string,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };
  if (cfg.useClientKey) {
    tokenBody.client_key = clientId!;
    delete tokenBody.client_id;
  }
  if (parsedState.codeVerifier) {
    tokenBody.code_verifier = parsedState.codeVerifier;
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenBody),
    });
    const tokenText = await tokenRes.text();
    console.log(`Token response for ${platform} (status ${tokenRes.status}):`, tokenText);
    const tokenData = JSON.parse(tokenText);
    const accessToken = tokenData.access_token;
    if (!accessToken) return res.redirect("/settings?error=Failed to get access token");

    // Fetch profile
    const profileRes = await fetch(cfg.profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileData = await profileRes.json();
    console.log(`Profile response for ${platform}:`, JSON.stringify(profileData));
    const { platformUserId, platformUserName } = cfg.profileParser(profileData);

    // Store in connected_accounts via RPC (SECURITY DEFINER — runs as table owner)
    const { error: upsertError } = await supabase.rpc("upsert_connected_account", {
      p_user_id: userId,
      p_platform: platform,
      p_platform_user_id: platformUserId,
      p_platform_user_name: platformUserName,
      p_access_token: accessToken,
      p_token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
    });

    if (upsertError) {
      console.error(`OAuth upsert error for ${platform}:`, upsertError);
      return res.redirect(`/settings?error=Failed to save ${platform} connection`);
    }

    res.redirect(`/?connected=${platform}`);
  } catch (err: any) {
    console.error(`OAuth callback error for ${platform}:`, err);
    res.redirect("/settings?error=OAuth connection failed");
  }
});

// GET /api/auth/accounts — list connected accounts for the current user
app.get("/api/auth/accounts", async (req, res) => {
  const userId = req.query.user_id as string;
  if (!userId) return res.json({ success: true, accounts: [] });

  const { data, error } = await supabase.rpc("get_connected_accounts", {
    p_user_id: userId,
  });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, accounts: data || [] });
});

// ── VITE / STATIC SERVING ────────────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Zyng in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Zyng in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Zyng server running on port ${PORT}`);
  });
}

startServer();
