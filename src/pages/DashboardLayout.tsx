import React, { useEffect } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useZyng } from "../context/ZyngContext";

export default function DashboardLayout() {
  const { nepaDraftActive, setTriggerDraftRecoverSignal, loadPosts } = useZyng();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      <Sidebar />

      <div className="flex-1 flex flex-col justify-between overflow-x-hidden min-h-screen">
        <Header nepaDraftActive={nepaDraftActive} onRecoverDraft={handleRecoverDraft} />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="bg-slate-950 border-t border-slate-900 px-8 py-4.5 flex justify-between items-center text-[11px] text-slate-500 font-mono shrink-0">
          <span>PRO ACTIVE QUEUE BROADCASTS CONNECTED</span>
          <span>&copy; Zyng 2026 · Built for Nigeria</span>
        </footer>
      </div>
    </div>
  );
}
