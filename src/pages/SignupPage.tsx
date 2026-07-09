import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useZyng } from "../context/ZyngContext";
import { supabase } from "../lib/supabase-client";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { setCurrentUser } = useZyng();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const getStrength = () => {
    if (!password) return { score: 0, label: "Empty", color: "bg-slate-800" };
    if (password.length < 5) return { score: 1, label: "Too Weak", color: "bg-rose-500" };
    if (password.length < 8) return { score: 2, label: "Medium Vibe", color: "bg-amber-500" };
    return { score: 3, label: "Solid Security Key", color: "bg-emerald-500" };
  };

  const ps = getStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Abeg you must agree to terms of usage first!");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setName("");
        setEmail("");
        setPassword("");
        setAgreeTerms(false);
        setSuccess(true);

        setCurrentUser(data.user);
        localStorage.setItem("zyng_user", JSON.stringify(data.user));
        if (data.session?.access_token) {
          localStorage.setItem("zyng_token", data.session.access_token);
        }
        if (data.session?.refresh_token) {
          localStorage.setItem("zyng_refresh_token", data.session.refresh_token);
        }

        setTimeout(() => {
          setSuccess(false);
          navigate("/dashboard");
        }, 1200);
      } else {
        setError(data.error || "Signup registered error.");
      }
    } catch {
      setError("Error connecting to signup endpoint");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-8 py-10 bg-[#050507] font-sans" id="signup-screen">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative z-10">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Start Free Social Scheduling</span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Join Zyng Socials</h2>
          <p className="text-xs text-slate-400">Create a social manager profile to deploy 6 cross-posting.</p>
        </div>

        {success && (
          <div className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-xl font-medium">Registration complete! Redirecting to workspace...</div>
        )}

        {error && (
          <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Full name / Brand title</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Your name or brand" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="you@example.com" required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Password strength</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" placeholder="Create password" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 mt-1 space-y-1">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${ps.color}`} style={{ width: `${(ps.score / 3) * 100}%` }}></div>
                </div>
                <span className="text-[9px] font-mono text-slate-500 block text-right font-semibold">Strength: {ps.label}</span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 py-1">
            <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 rounded border-slate-850 text-indigo-600 bg-slate-950 focus:ring-0 focus:outline-none" id="agree-terms-check" />
            <label htmlFor="agree-terms-check" className="text-[11px] text-slate-400 leading-tight">
              Agree to standard term of usage, Pro subscription pricing models, and WAT timezone scheduling defaults.
            </label>
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-1 cursor-pointer" id="signup-submit-btn">Create Free Account</button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500 font-mono text-[10px]">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {[
            { id: "google", label: "Google", icon: <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> },
            { id: "facebook", label: "Meta", icon: <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
            { id: "twitter", label: "X", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
            { id: "linkedin", label: "In", icon: <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
            { id: "instagram", label: "IG", icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
          ].map((p) => (
            <button
              key={p.id}
              onClick={async () => {
                const csrfState = Math.random().toString(36).substring(2);
                localStorage.setItem(`${p.id}_login_state`, csrfState);
                localStorage.setItem("current_oauth_provider", p.id);
                if (p.id === "linkedin") {
                  const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
                  const redirectUri = `${window.location.origin}/auth/callback?provider=linkedin`;
                  window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&state=${csrfState}`;
                } else if (p.id === "twitter") {
                  const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
                  const redirectUri = `${window.location.origin}/auth/callback?provider=twitter`;
                  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();
                  const verifierData = new TextEncoder().encode(codeVerifier);
                  const verifierDigest = await crypto.subtle.digest("SHA-256", verifierData);
                  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(verifierDigest))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
                  localStorage.setItem("twitter_code_verifier", codeVerifier);
                  window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("tweet.read users.read offline.access")}&state=${csrfState}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
                } else if (p.id === "instagram") {
                  const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
                  const redirectUri = `${window.location.origin}/auth/callback?provider=instagram`;
                  window.location.href = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile&response_type=code&state=${csrfState}`;
                } else {
                  localStorage.removeItem("current_oauth_provider");
                  supabase.auth.signInWithOAuth({
                    provider: p.id as any,
                    options: { redirectTo: `${window.location.origin}/auth/callback` },
                  });
                }
              }}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 transition-colors cursor-pointer group"
              title={`Sign up with ${p.label}`}
            >
              {p.icon}
              <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-medium truncate">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="text-center text-xs text-slate-500 pt-1">
          Already have an automated ledger account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">Log in</Link>
        </div>
      </div>
    </div>
  );
}
