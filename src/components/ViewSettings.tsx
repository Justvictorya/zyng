import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Settings, 
  Layers, 
  Zap, 
  Check, 
  ShieldCheck, 
  QrCode, 
  Loader2, 
  RefreshCw, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function ViewSettings() {
  const { dialect, currentUser: user, handleUserUpdate: onUserUpdate } = useZyng();
  const t = translations[dialect];

  // Subscription plan states
  const [activePlan, setActivePlan] = useState<"Free" | "Pro" | "Enterprise">(user?.tier || "Pro");
  
  // Paystack credit card simulator
  const [cardName, setCardName] = useState(user?.name || "Victoria John");
  const [cardNumber, setCardNumber] = useState("4321 8890 2231 1009");
  const [expiry, setExpiry] = useState("09/28");
  const [cvv, setCvv] = useState("329");
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Social account linking states
  const [linkedAccounts, setLinkedAccounts] = useState<Set<string>>(new Set());
  const [connectingNetwork, setConnectingNetwork] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch connected accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      const savedUser = localStorage.getItem("zyng_user");
      if (!savedUser) return;
      const uid = JSON.parse(savedUser).id;
      try {
        const res = await fetch(`/api/auth/accounts?user_id=${uid}`);
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

  // Handle OAuth callback params (?connected=... or ?error=...)
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

  const handleConnect = (networkId: string) => {
    const savedUser = localStorage.getItem("zyng_user");
    if (!savedUser) return;
    const uid = JSON.parse(savedUser).id;
    window.location.href = `/api/auth/${networkId}/connect?user_id=${uid}`;
  };

  const handleDisconnect = async (networkId: string) => {
    // For now just reset locally — real disconnect would call API
    setLinkedAccounts(prev => {
      const next = new Set(prev);
      next.delete(networkId);
      return next;
    });
  };

  const handlePaystackSandboxTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPaystack(true);
    setPaymentSuccess(false);

    setTimeout(() => {
      setIsProcessingPaystack(false);
      setPaymentSuccess(true);
      // Update app state
      onUserUpdate({ tier: "Pro" });
      setActivePlan("Pro");
      
      setTimeout(() => setPaymentSuccess(false), 5000);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in text-slate-200" id="zyng-view-settings">
      
      {/* 1. Pricing Plan Choice Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Zyng Subscription Plans
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a plan to power your social scheduling. Pay locally via secure Paystack processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Free Plan */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
            activePlan === "Free" ? "bg-slate-900 border-indigo-500 shadow-md" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">Standard Draft</span>
              <h4 className="text-lg font-bold text-slate-200">Starter Free</h4>
              <p className="text-[20px] font-bold font-mono text-slate-100">₦0 <span className="text-xs text-slate-500">/ forever</span></p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> max 10 posts/month</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> 2 connected channels</li>
                <li className="text-slate-650 flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Standard caption AI</li>
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

          {/* Pro Plan (RECOMMENDED) */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden ${
            activePlan === "Pro" || user?.tier === "Pro" ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-950/20" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold px-3 py-1 font-mono uppercase tracking-widest rounded-bl-xl shadow-md">
              HACKATHON ACTIVE
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase block font-bold">Recommended for Business</span>
              <h4 className="text-lg font-bold text-slate-100">Zyng Pro</h4>
              <p className="text-[20px] font-bold font-mono text-indigo-300">₦12,000 <span className="text-xs text-slate-500">/ month</span></p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> **Unlimited scheduling**</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> All 6 cross-posting platforms</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> WhatsApp Status automation</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Modern Gemini AI operational suite</li>
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
              <span className="text-[10px] font-mono text-violet-400 uppercase block font-bold">Collab & Scales</span>
              <h4 className="text-lg font-bold text-slate-200">Enterprise Large</h4>
              <p className="text-[20px] font-bold font-mono text-slate-100">₦50,000 <span className="text-xs text-slate-500">/ month</span></p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Everything inside Pro</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Multiple team accounts</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> White Label agency configuration</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> API Direct Core link</li>
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

      {/* 2. Paystack Credit Card checkout sandbox simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        
        {/* Card Simulator interface */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-200">Paystack Checkout Gateway Sandbox</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Local currency processing</span>
            </div>

            {/* Simulated virtual credit card layout */}
            <div className="relative overflow-hidden h-40 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-950 to-violet-950 border border-indigo-500/30 p-5 font-mono shadow-lg text-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">NIGERIAN CARD SANDBOX</span>
                  <span className="text-xs font-bold text-indigo-300">Access Bank Platinum</span>
                </div>
                <div className="h-7 w-10 bg-slate-900/60 rounded flex items-center justify-center p-1 text-[10px] font-bold text-amber-500 shrink-0">
                  CHIP
                </div>
              </div>

              <div>
                <span className="text-sm font-mono tracking-widest block text-slate-200">
                  {cardNumber || "•••• •••• •••• ••••"}
                </span>
              </div>

              <div className="flex justify-between items-end text-xs">
                <div>
                  <span className="text-[8px] text-slate-500 block uppercase">Cardholder</span>
                  <span className="text-[11px] truncate block text-slate-300 uppercase font-normal">{cardName || "Victoria John"}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-500 block uppercase">Expiry</span>
                  <span className="text-[11px] font-medium text-slate-350">{expiry || "MM/YY"}</span>
                </div>
              </div>
            </div>

            {/* Small instructional note */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <p className="leading-relaxed font-sans">
                This is a sandbox merchant account representation. Perfect for demoing Victoria's subscription upgrades dynamically.
              </p>
            </div>
          </div>
        </div>

        {/* Payment input form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <form onSubmit={handlePaystackSandboxTrigger} className="space-y-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Invoice Ledger Details</h5>
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase block">Cardholder Name</label>
              <input 
                type="text" 
                value={cardName} 
                onChange={(e) => setCardName(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Cardholder name"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Card number</label>
                <input 
                  type="text" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">CVV</label>
                <input 
                  type="password" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  placeholder="xxx"
                  maxLength={3}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessingPaystack}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              id="paystack-billing-submit"
            >
              {isProcessingPaystack ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing merchant transaction...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Process Paystack Sandbox Payment (₦12,000)</span>
                </>
              )}
            </button>

            {paymentSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>Transaction processed! Victoria's subscription active.</span>
              </div>
            )}
          </form>
        </div>

      </div>

      {/* 3. Cross Channel linking manager controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="border-b border-slate-850 pb-3 mb-6">
          <h4 className="text-sm font-semibold text-slate-200">Connected Accounts Manager</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Link or unlink social media api profiles for direct automated postings</p>
        </div>

        {connectingNetwork && (
          <div className="mb-4 p-4.5 bg-indigo-950/20 border border-indigo-550/25 rounded-xl flex items-center justify-center gap-3 text-xs text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span>Establishing secure authentication link to {connectingNetwork}...</span>
          </div>
        )}

        {toast && (
          <div className="mb-4 p-3 bg-emerald-950 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Loop over channels */}
          {["facebook","instagram","tiktok","twitter","linkedin","whatsapp","youtube"].map((net) => {
            const linked = linkedAccounts.has(net);
            const label = net.charAt(0).toUpperCase() + net.slice(1);
            return (
              <div key={net} className="bg-slate-950 border border-slate-850/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">{label} Channel connect</span>
                  <span className={`text-[10px] font-mono block ${linked ? "text-emerald-450" : "text-slate-550"}`}>
                    {linked ? "● Ready" : "○ Offline"}
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
