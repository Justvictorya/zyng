import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useZyng } from "../context/ZyngContext";

export default function SignupPage() {
  const { setCurrentUser } = useZyng();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <span className="text-[10px] text-indigo-400 font-bold font-mono tracking-widest uppercase">Start Free Social Campaigns</span>
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
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" placeholder="Create password" required />
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

        <div className="text-center text-xs text-slate-500 pt-1">
          Already have an automated ledger account?{" "}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">Log in</Link>
        </div>
      </div>
    </div>
  );
}
