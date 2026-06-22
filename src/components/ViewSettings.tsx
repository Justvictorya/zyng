import React, { useState, useEffect } from "react";
import { 
  Check,
  Loader2, 
  CheckCircle,
} from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function ViewSettings() {
  const { dialect, currentUser: user, handleUserUpdate: onUserUpdate } = useZyng();
  const t = translations[dialect];

  const [activePlan, setActivePlan] = useState<"Free" | "Pro" | "Enterprise">(user?.tier || "Pro");
  const [linkedAccounts, setLinkedAccounts] = useState<Set<string>>(new Set());
  const [connectingNetwork, setConnectingNetwork] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const token = localStorage.getItem("zyng_token");
      if (!token) return;
      try {
        const res = await fetch("/api/auth/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setLinkedAccounts(new Set(data.accounts.map((a: any) => a.platform)));
        }
      } catch (e) {
        console.error("Failed to fetch connected accounts", e);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      setToast(`Connected to ${connected}!`);
      setLinkedAccounts(prev => new Set(prev).add(connected));
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setToast(null), 4000);
    } else if (error) {
      setToast(`Error: ${error}`);
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const handleConnect = async (networkId: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    setConnectingNetwork(networkId);
    try {
      const res = await fetch(`/api/auth/${networkId}/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Failed to start OAuth", e);
      setConnectingNetwork(null);
    }
  };

  const handleDisconnect = async (networkId: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/auth/accounts/${networkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setLinkedAccounts(prev => {
          const next = new Set(prev);
          next.delete(networkId);
          return next;
        });
        setToast(`Disconnected from ${networkId}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error("Failed to disconnect", e);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-slate-200" id="zyng-view-settings">
      
      {/* 1. Plan Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Zyng Subscription Plans
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a plan to power your social scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free Plan */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
            activePlan === "Free" ? "bg-slate-900 border-indigo-500 shadow-md" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Starter</span>
              <h4 className="text-lg font-bold text-slate-200">Free</h4>
              <p className="text-[20px] font-bold font-mono text-slate-100">Free</p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Limited posts</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Basic channels</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Standard caption AI</li>
              </ul>
            </div>
            
            <button 
              onClick={() => {
                setActivePlan("Free");
                onUserUpdate({ tier: "Free" });
              }}
              className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 text-xs font-semibold rounded-xl border border-slate-850 cursor-pointer"
            >
              {user?.tier === "Free" ? "Active Plan" : "Switch to Free"}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
            activePlan === "Pro" || user?.tier === "Pro" ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-950/20" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase block font-bold">Recommended</span>
              <h4 className="text-lg font-bold text-slate-100">Pro</h4>
              <p className="text-[20px] font-bold font-mono text-indigo-300">Paid</p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Unlimited scheduling</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> All cross-posting platforms</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> WhatsApp Status automation</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Gemini AI operational suite</li>
              </ul>
            </div>
            
            <button 
              onClick={() => {
                setActivePlan("Pro");
                onUserUpdate({ tier: "Pro" });
              }}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg cursor-pointer transition-colors"
            >
              {user?.tier === "Pro" ? "Active Pro Plan" : "Upgrade to Pro"}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
            activePlan === "Enterprise" ? "bg-slate-900 border-indigo-500 shadow-md" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-violet-400 uppercase block font-bold">Scale</span>
              <h4 className="text-lg font-bold text-slate-200">Enterprise</h4>
              <p className="text-[20px] font-bold font-mono text-slate-100">Custom</p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Everything in Pro</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Multiple team accounts</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> White-label configuration</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> API access</li>
              </ul>
            </div>
            
            <button 
              onClick={() => {
                setActivePlan("Enterprise");
                onUserUpdate({ tier: "Enterprise" });
              }}
              className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 text-xs font-semibold rounded-xl border border-slate-850 cursor-pointer"
            >
              {user?.tier === "Enterprise" ? "Active Plan" : "Switch to Enterprise"}
            </button>
          </div>

        </div>
      </div>

      {/* 2. Connected Accounts Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="border-b border-slate-850 pb-3 mb-6">
          <h4 className="text-sm font-semibold text-slate-200">Connected Accounts</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Link social media profiles for automated posting</p>
        </div>

        {connectingNetwork && (
          <div className="mb-4 p-4.5 bg-indigo-950/20 border border-indigo-550/25 rounded-xl flex items-center justify-center gap-3 text-xs text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Connecting to {connectingNetwork}...</span>
          </div>
        )}

        {toast && (
          <div className="mb-4 p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {["facebook","instagram","tiktok","twitter","linkedin","whatsapp","youtube"].map((net) => {
            const linked = linkedAccounts.has(net);
            const label = net.charAt(0).toUpperCase() + net.slice(1);
            return (
              <div key={net} className="bg-slate-950 border border-slate-850/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">{label}</span>
                  <span className={`text-[10px] font-mono block ${linked ? "text-emerald-450" : "text-slate-550"}`}>
                    {linked ? "● Connected" : "○ Offline"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => linked ? handleDisconnect(net) : handleConnect(net)}
                    className={`px-3 py-1.5 text-[10px] font-mono border rounded ${
                      linked 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-semibold" 
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-bold"
                    }`}
                    id={`linker-${net}`}
                  >
                    {linked ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}
