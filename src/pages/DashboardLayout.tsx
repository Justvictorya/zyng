import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useZyng } from "../context/ZyngContext";

export default function DashboardLayout() {
  const { nepaDraftActive, setTriggerDraftRecoverSignal, loadPosts } = useZyng();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (searchParams.get("connected") || searchParams.get("error")) {
      navigate("/dashboard/settings", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleRecoverDraft = () => {
    navigate("/dashboard/create-post");
    setTriggerDraftRecoverSignal(true);
  };

  return (
    <div className="flex bg-[#050507] min-h-screen relative font-sans" id="workspace-layout">
      {/* Mobile hamburger button (visible below lg) */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-slate-300 hover:text-white"
        aria-label="Open menu"
        id="mobile-menu-btn"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col justify-between overflow-x-hidden min-h-screen">
        <Header nepaDraftActive={nepaDraftActive} onRecoverDraft={handleRecoverDraft} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="bg-slate-950 border-t border-slate-900 px-4 sm:px-8 py-4.5 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500 font-mono shrink-0">
          <span>PRO ACTIVE QUEUE BROADCASTS CONNECTED</span>
          <span>&copy; Zyng 2026 · Built for Nigeria</span>
        </footer>
      </div>
    </div>
  );
}
