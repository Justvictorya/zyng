import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, RefreshCw } from "lucide-react";
import { useZyng } from "../context/ZyngContext";
import { supabase } from "../lib/supabase-client";

export default function LoginPage() {
  const { setCurrentUser, loadPosts } = useZyng();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        if (data.session?.access_token) {
          localStorage.setItem("zyng_token", data.session.access_token);
        }
        if (data.session?.refresh_token) {
          localStorage.setItem("zyng_refresh_token", data.session.refresh_token);
        }
        navigate("/dashboard");
        loadPosts();
      } else {
        setError(data.error || "Credentials invalid.");
      }
    } catch {
      setError("Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  const platforms = [
    { id: "google", label: "Google", title: "Login with Google", supabase: true },
    { id: "facebook", label: "Meta", title: "Login with Facebook", supabase: true },
    { id: "twitter", label: "X", title: "Login with Twitter", supabase: false },
    { id: "linkedin", label: "In", title: "Login with LinkedIn", supabase: false },
    { id: "tiktok", label: "TikTok", title: "Login with TikTok", supabase: false },
  ];

  const icons: Record<string, React.ReactNode> = {
    google: <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
    facebook: <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    twitter: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    linkedin: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    tiktok: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  };

  async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }

  async function initiateSocialLogin(p: { id: string; supabase: boolean }) {
    if (p.supabase) {
      supabase.auth.signInWithOAuth({
        provider: p.id as any,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return;
    }

    const csrfState = Math.random().toString(36).substring(2);
    localStorage.setItem(`${p.id}_login_state`, csrfState);
    localStorage.setItem("current_oauth_provider", p.id);

    if (p.id === "tiktok") {
      const clientId = import.meta.env.VITE_TIKTOK_CLIENT_ID;
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      localStorage.setItem("tiktok_code_verifier", codeVerifier);
      const redirectUri = `${window.location.origin}/api/v1/oauth/tiktok/callback`;
      window.location.href = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    } else if (p.id === "linkedin") {
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback?provider=linkedin`;
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${csrfState}`;
    } else if (p.id === "twitter") {
      const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback?provider=twitter`;
      const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      localStorage.setItem("twitter_code_verifier", codeVerifier);
      window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("tweet.read users.read offline.access")}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-8 py-14 bg-[#050507] font-sans" id="login-screen">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Secure Authentication Gateway</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 font-sans">Welcome back to Zyng</h2>
          <p className="text-xs text-slate-400">Log in to proceed with your automated social management schedules.</p>
        </div>

        {error && (
          <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="you@example.com" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Password</label>
              <span className="text-[10px] text-slate-500 hover:text-indigo-400 cursor-pointer">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-xs flex items-center justify-center gap-1 cursor-pointer" id="login-submit-btn">
            {isLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : null}
            <span>Authenticate Credentials</span>
          </button>
        </form>

        <div className="space-y-2 mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500 font-mono text-[10px]">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {platforms.map((p) => (
              <button key={p.id} onClick={() => initiateSocialLogin(p)} className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group" title={p.title}>
                {icons[p.id]}
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 selection:bg-none">
          Don't have a social campaign yet?{" "}
          <Link to="/signup" className="text-indigo-400 hover:underline font-semibold">Join free beta</Link>
        </div>
      </div>
    </div>
  );
}
