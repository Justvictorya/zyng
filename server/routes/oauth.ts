import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";
import { OAUTH_CONFIG, oauthRedirectUri, getOauthClientId } from "../config/oauth";
import { optionalAuth } from "../middleware/auth";
import { env } from "../config/env";

const router = Router();

router.get("/:platform/connect", optionalAuth, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.query.user_id as string || req.userId;

  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(404).json({ error: `Unknown platform: ${platform}` });

  const clientId = getOauthClientId(platform);
  if (!clientId) {
    return res.redirect(`/?error=${platform} credentials not configured in .env`);
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

router.get("/:platform/callback", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, state, error: oauthError } = req.query;

  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(404).send("Unknown platform");

  if (oauthError) {
    return res.redirect(`/?error=${platform} authorization was denied`);
  }

  if (!code) return res.redirect("/?error=No authorization code received");

  let parsedState: any = {};
  try {
    parsedState = JSON.parse(decodeURIComponent(state as string));
  } catch {}
  const userId = parsedState.userId;
  if (!userId) return res.redirect("/?error=Missing user session");

  const clientId = getOauthClientId(platform);
  const clientSecret = env(cfg.clientSecretEnv);
  const redirectUri = oauthRedirectUri(req, platform);

  const tokenBody: Record<string, string> = {
    client_id: clientId!,
    client_secret: clientSecret,
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
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(tokenBody),
    });

    const tokenText = await tokenRes.text();
    console.log(`[OAuth] Token response for ${platform} (${tokenRes.status}):`, tokenText.substring(0, 200));

    const tokenData = JSON.parse(tokenText);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`/?error=Failed to get access token for ${platform}`);
    }

    const profileRes = await fetch(cfg.profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profileData = await profileRes.json();
    console.log(`[OAuth] Profile response for ${platform}:`, JSON.stringify(profileData).substring(0, 200));

    const { platformUserId, platformUserName } = cfg.profileParser(profileData);

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
      console.error(`[OAuth] Upsert error for ${platform}:`, upsertError);
      return res.redirect(`/?error=Failed to save ${platform} connection`);
    }

    res.redirect(`/?connected=${platform}`);
  } catch (err: any) {
    console.error(`[OAuth] Callback error for ${platform}:`, err.message);
    res.redirect("/?error=OAuth connection failed");
  }
});

router.get("/accounts", optionalAuth, async (req: Request, res: Response) => {
  const userId = req.query.user_id as string || req.userId;
  if (!userId) return res.json({ success: true, accounts: [] });

  const { data, error } = await supabase.rpc("get_connected_accounts", {
    p_user_id: userId,
  });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, accounts: data || [] });
});

export default router;
