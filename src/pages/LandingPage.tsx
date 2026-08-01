import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Zap, ArrowRight, Calendar, Wand2, Globe, BarChart3,
  Check, Sparkles, Shield, Star
} from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Caption Engine",
    desc: "Gemini-powered captions in English, Pidgin, Yoruba, Hausa, and Igbo. Slang-preserving grammar fixes. Viral hook blueprints.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Queue posts across 7 platforms on a single calendar. Per-platform scheduling, NEPA-proof draft recovery, and timezone-aware queues.",
  },
  {
    icon: Globe,
    title: "Cross-Platform Publishing",
    desc: "Publish to Facebook, Instagram, TikTok, X/Twitter, LinkedIn, YouTube, and WhatsApp Status from one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Track published posts, delivery status, and platform performance. Export CSV reports for your records.",
  },
  {
    icon: Shield,
    title: "Algorithm Scanner",
    desc: "AI scans your captions for shadowban triggers, flagged keywords, and algorithmic suppression before you post.",
  },
  {
    icon: Sparkles,
    title: "Viral URL Blueprint",
    desc: "Paste any viral post URL. AI extracts the psychological hook and generates 5 localized spin-off drafts.",
  },
];

const PLATFORMS = [
  { name: "Facebook", color: "text-blue-400" },
  { name: "Instagram", color: "text-pink-400" },
  { name: "TikTok", color: "text-cyan-400" },
  { name: "X / Twitter", color: "text-slate-300" },
  { name: "LinkedIn", color: "text-indigo-400" },
  { name: "YouTube", color: "text-red-400" },
  { name: "WhatsApp", color: "text-emerald-400" },
];

const STEPS = [
  { num: "01", title: "Connect Platforms", desc: "Link your social accounts with secure OAuth. One-click connections for all 7 platforms." },
  { num: "02", title: "Create with AI", desc: "Write captions, fix grammar, switch dialects, and generate viral hooks - all powered by Gemini." },
  { num: "03", title: "Schedule & Publish", desc: "Queue posts to your preferred time slots. Zyng handles the rest - even when NEPA strikes." },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "",
    desc: "Perfect for trying Zyng out",
    features: ["10 posts / month", "2 platforms", "Standard AI captions", "Basic scheduling"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "12,000",
    period: "/month",
    desc: "For serious content creators",
    features: ["Unlimited scheduling", "All 7 platforms", "WhatsApp automation", "Gemini AI suite", "Priority support"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "50,000",
    period: "/month",
    desc: "For teams and agencies",
    features: ["Everything in Pro", "Team accounts", "White-label dashboard", "API access", "Dedicated support"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [urlError, setUrlError] = useState(() => {
    const q = new URLSearchParams(window.location.search).get("error");
    return q || "";
  });
  useEffect(() => {
    if (urlError) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-white" id="landing-screen">
      {/* Decorative orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-600/3 blur-[150px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex justify-between items-center px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/40">
            <Zap className="h-4.5 w-4.5 text-white animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Zyng</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/login")} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Log In</button>
          <button onClick={() => navigate("/signup")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:-translate-y-0.5">Get Started</button>
        </div>
      </header>

      {urlError && (
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6">
          <div className="bg-rose-950 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl font-medium">{urlError.replace(/\+/g, " ")}</div>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 w-full max-w-5xl mx-auto text-center px-6 pt-16 pb-20">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-6">
          <Star className="h-3 w-3 text-indigo-400" />
          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Built for Nigeria</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
          <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Social Media,</span>
          <br />
          <span className="bg-gradient-to-tr from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent italic">Automated for Africa.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed mb-10">
          Draft posts with AI, fix slang grammar, cross-post to 7 platforms, and schedule everything from one dashboard. Powered by Gemini. Priced in Naira.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
          <button onClick={() => navigate("/signup")} className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
            Start Managing for Free
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate("/login")} className="w-full sm:w-auto border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/20 text-sm font-semibold px-8 py-3.5 rounded-xl transition-all">
            Log In to Dashboard
          </button>
        </div>

        {/* Platform logos */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {PLATFORMS.map(p => (
            <span key={p.name} className={`text-[11px] uppercase font-bold tracking-wider ${p.color} opacity-70`}>{p.name}</span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">How It Works</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">Three steps to go live</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(step => (
            <div key={step.num} className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-400 font-mono">{step.num}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Features</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">Everything you need to post smarter</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:from-violet-600/30 group-hover:to-indigo-600/30 transition-colors">
                <f.icon className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pricing</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">Simple Naira pricing</h2>
          <p className="text-xs text-slate-500 mt-2">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-6 border transition-all ${
              plan.highlighted
                ? "bg-gradient-to-b from-indigo-600/10 to-violet-600/10 border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-xl shadow-indigo-900/20"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}>
              {plan.highlighted && (
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">Most Popular</span>
              )}
              <h3 className="text-sm font-bold text-white mt-2">{plan.name}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">{plan.desc}</p>
              <div className="mt-4 mb-5">
                <span className="text-3xl font-bold text-white">&#8358;</span>
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-slate-500">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/signup")} className={`w-full text-xs font-semibold py-2.5 rounded-xl transition-all ${
                plan.highlighted
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                  : "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-b from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-3xl p-12">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Ready to automate your socials?
          </h2>
          <p className="text-xs text-slate-400 mb-8 max-w-md mx-auto">
            Join Nigerian creators and businesses using Zyng to manage their social media presence. Free to start.
          </p>
          <button onClick={() => navigate("/signup")} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-10 py-3.5 rounded-xl shadow-xl shadow-indigo-900/30 transition-all inline-flex items-center gap-2 hover:-translate-y-0.5">
            Get Started for Free
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/50">
        <div className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-500">Zyng</span>
            <span className="text-[10px] text-slate-600">2026</span>
          </div>
          <div className="flex gap-5">
            <a href="/terms" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Terms</a>
            <a href="/privacy" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Privacy</a>
            <a href="/data-deletion" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Data Deletion</a>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">Built for Nigeria</span>
        </div>
      </footer>
    </div>
  );
}
