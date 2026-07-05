import { useNavigate } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center px-4 md:px-8 py-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-[#050507] to-[#050507]" id="landing-screen">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl"></div>

      <header className="w-full max-w-6xl flex justify-between items-center relative z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-950/40">
            <Zap className="h-4.5 w-4.5 text-white animate-pulse" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Zyng</span>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/login")} className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">Log In</button>
          <button onClick={() => navigate("/signup")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4.5 py-2 rounded-xl shadow-lg shadow-indigo-900/20 transition-all transform hover:-translate-y-0.5">Get Started</button>
        </div>
      </header>

      <main className="w-full max-w-4xl text-center flex flex-col items-center justify-center my-14 relative z-10 space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-sans font-bold tracking-tight bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent leading-[1.1]">
          Social Management,<br />
          <span className="bg-gradient-to-tr from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent italic">Localized for Nigeria.</span>
        </h1>

        <p className="max-w-2xl text-slate-400 text-sm sm:text-base leading-relaxed">
          Zyng is a Social Media Automation engine built for Nigeria. Draft, fix slang grammar with Gemini, cross-post to Instagram & WhatsApp status, and manage all your platforms from one place.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 items-center shrink-0">
          <button onClick={() => navigate("/signup")} className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-8 py-4 rounded-xl shadow-xl shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
            <span>Start Managing for Free</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate("/login")} className="w-full sm:w-auto border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/20 text-xs font-semibold px-8 py-4 rounded-xl transition-all cursor-pointer">Log In to Dashboard</button>
        </div>

        <div className="pt-12 grid grid-cols-7 gap-6 justify-center items-center opacity-70">
          {["Facebook", "Instagram", "YouTube", "WhatsApp Status", "TikTok", "LinkedIn", "X / Twitter"].map(p => (
            <span key={p} className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{p}</span>
          ))}
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-600 font-mono relative z-10 shrink-0">
        Subscription billing available. Powered by Gemini AI.
      </footer>
    </div>
  );
}
