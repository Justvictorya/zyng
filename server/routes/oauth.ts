import { Router, Request, Response } from "express";
import crypto from "crypto";
import { supabase, serviceDb } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { OAUTH_CONFIG, oauthRedirectUri, getOauthClientId, getOauthClientSecret } from "../config/oauth";

const router = Router();

async function saveOAuthState(stateId: string, userId: string, csrf: string, codeVerifier?: string) {
  try {
    await serviceDb.from("oauth_states").insert({
      state_id: stateId,
      user_id: userId,
      csrf,
      code_verifier: codeVerifier || null,
    });
    setTimeout(async () => {
      await serviceDb.from("oauth_states").delete().eq("state_id", stateId);
    }, 10 * 60 * 1000);
  } catch (e) {
    console.error("[OAuth] Failed to save state:", e);
  }
}

async function getOAuthState(stateId: string) {
  try {
    const { data } = await serviceDb.from("oauth_states").select("*").eq("state_id", stateId).single();
    if (data) {
      await serviceDb.from("oauth_states").delete().eq("state_id", stateId);
    }
    return data;
  } catch (e) {
    console.error("[OAuth] Failed to get state:", e);
    return null;
  }
}

router.get("/:platform/connect", requireAuth, async (req: Request, res: Response) => {
  const { platform } = req.params;
  const userId = req.userId!;

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

  const stateId = crypto.randomUUID();
  const csrf = crypto.randomBytes(16).toString("hex");
  await saveOAuthState(stateId, userId, csrf, codeVerifier);

  const state = `${stateId}:${csrf}`;
  const redirectUri = oauthRedirectUri(req, platform);
  const clientIdParam = cfg.useClientKey ? "client_key" : "client_id";

  let authUrl = `${cfg.authorizeUrl}?${clientIdParam}=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(cfg.scope)}&response_type=code&state=${encodeURIComponent(state)}`;

  if (cfg.needsPkce) {
    authUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }

  if (cfg.extraAuthorizeParams) {
    authUrl += `&${cfg.extraAuthorizeParams}`;
  }

  res.json({ success: true, url: authUrl });
});

router.get("/:platform/callback", async (req: Request, res: Response) => {
  const { platform } = req.params;
  const { code, state, error: oauthError } = req.query;

  const rawState = state as string;

  // If state is a simple CSRF (no colon), this is a login flow callback — redirect to frontend
  if (rawState && !rawState.includes(":")) {
    return res.redirect(`/auth/callback?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(rawState)}&provider=${platform}`);
  }

  const cfg = OAUTH_CONFIG[platform];
  if (!cfg) return res.status(404).send("Unknown platform");

    if (oauthError) {
    return res.redirect(`/dashboard/settings?error=${platform} authorization was denied`);
  }

  if (!code) return res.redirect("/dashboard/settings?error=No authorization code received");

  let parsedState: { stateId: string; csrf: string } | null = null;
  try {
    const sep = rawState.indexOf(":");
    parsedState = { stateId: rawState.substring(0, sep), csrf: rawState.substring(sep + 1) };
  } catch (e) {
    console.error(`[OAuth] State parse error for ${platform}:`, e, "state:", rawState);
    return res.redirect("/?error=Invalid OAuth state");
  }

  const pending = await getOAuthState(parsedState.stateId);
  if (!pending || pending.csrf !== parsedState.csrf) {
    return res.redirect("/?error=OAuth session expired or invalid");
  }

  const userId = pending.user_id;
  const codeVerifier = pending.code_verifier;

  const clientId = getOauthClientId(platform);
  const clientSecret = getOauthClientSecret(platform);
  const redirectUri = oauthRedirectUri(req, platform);

  const tokenBody: Record<string, string> = {
    code: code as string,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  if (!cfg.needsBasicAuth) {
    tokenBody.client_id = clientId!;
    tokenBody.client_secret = clientSecret;
  }

  if (cfg.useClientKey) {
    tokenBody.client_key = clientId!;
    delete tokenBody.client_id;
  }

  if (codeVerifier) {
    tokenBody.code_verifier = codeVerifier;
  }

  const tokenHeaders: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
  if (cfg.needsBasicAuth) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    tokenHeaders["Authorization"] = `Basic ${encoded}`;
  }

  try {
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: tokenHeaders,
      body: new URLSearchParams(tokenBody),
    });

    const tokenText = await tokenRes.text();
    if (tokenRes.status >= 400) console.error(`[OAuth] Token error for ${platform}: ${tokenRes.status}`);

    let tokenData: any;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      console.error(`[OAuth] Invalid JSON from ${platform} token endpoint:`, tokenText.substring(0, 200));
      return res.redirect("/?error=Invalid response from OAuth provider");
    }
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`/?error=Failed to get access token for ${platform}`);
    }

    const profileRes = await fetch(cfg.profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profileData = await profileRes.json();

    const { platformUserId, platformUserName } = cfg.profileParser(profileData);

    if (platform === "instagram") {
      // For Instagram through Business app, also save the Facebook connection
      // and try to find Instagram Business Account from user's pages
      let igUserId = platformUserId;
      let igUserName = platformUserName;

      try {
        const pagesRes = await fetch(
          "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,username}",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const pagesData = await pagesRes.json();
        const page = pagesData.data?.[0];
        if (page?.instagram_business_account) {
          igUserId = page.instagram_business_account.id;
          igUserName = page.instagram_business_account.username;
        }
      } catch (e) {
        console.warn("[OAuth] Could not fetch Instagram Business Account:", e);
      }

      const { error: upsertError } = await supabase.rpc("upsert_connected_account", {
        p_user_id: userId,
        p_platform: "instagram",
        p_platform_user_id: igUserId,
        p_platform_user_name: igUserName,
        p_access_token: accessToken,
        p_token_expires_at: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        p_refresh_token: tokenData.refresh_token || null,
      });

      if (upsertError) {
        console.error("[OAuth] Instagram upsert error:", upsertError);
        return res.redirect(`/?error=Failed to save Instagram connection`);
      }

      // Also save/update Facebook connection with the same token
      try {
        const { error: fbErr } = await supabase.rpc("upsert_connected_account", {
          p_user_id: userId,
          p_platform: "facebook",
          p_platform_user_id: platformUserId,
          p_platform_user_name: platformUserName,
          p_access_token: accessToken,
          p_token_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          p_refresh_token: tokenData.refresh_token || null,
        });
        if (fbErr) console.warn("[OAuth] Facebook upsert failed:", fbErr);
      } catch (e) {
        console.warn("[OAuth] Facebook upsert failed:", e);
      }

      return res.redirect(`/dashboard/settings?connected=instagram`);
    }

    const { error: upsertError } = await supabase.rpc("upsert_connected_account", {
      p_user_id: userId,
      p_platform: platform,
      p_platform_user_id: platformUserId,
      p_platform_user_name: platformUserName,
      p_access_token: accessToken,
      p_token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      p_refresh_token: tokenData.refresh_token || null,
    });

    if (upsertError) {
      console.error(`[OAuth] Upsert error for ${platform}:`, upsertError);
      return res.redirect(`/?error=Failed to save ${platform} connection`);
    }

    res.redirect(`/dashboard/settings?connected=${platform}`);
  } catch (err: any) {
    console.error(`[OAuth] Callback error for ${platform}:`, err.message);
    res.redirect("/?error=OAuth connection failed");
  }
});

router.get("/accounts", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const { data, error } = await serviceDb
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, accounts: data || [] });
});

router.delete("/accounts/:platform", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ success: false, error: "Not authenticated" });

  const { platform } = req.params;

  const { error } = await serviceDb
    .from("connected_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

export default router;