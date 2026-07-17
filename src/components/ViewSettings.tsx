import React, { useState, useEffect, useCallback } from "react";
import { 
  Check,
  Loader2, 
  CheckCircle,
  CreditCard,
  ExternalLink,
  Zap,
  User,
  Mail,
  Lock,
  Save,
  Users,
  Trash2,
  Send,
  XCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).PaystackPop) return resolve();
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  status: "pending" | "active";
  invited_at: string;
  joined_at: string | null;
}

export default function ViewSettings() {
  const { dialect, currentUser: user, handleUserUpdate: onUserUpdate } = useZyng();
  const t = translations[dialect];

  const [activePlan, setActivePlan] = useState<"Free" | "Pro" | "Enterprise">(user?.tier || "Pro");
  const [linkingPlan, setLinkingPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [linkedAccounts, setLinkedAccounts] = useState<Set<string>>(new Set());
  const [connectingNetwork, setConnectingNetwork] = useState<string | null>(null);

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [password, setPassword] = useState({ current: "", newPass: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const token = localStorage.getItem("zyng_token");
      if (!token) return;
      try {
        const res = await fetch("/api/oauth/accounts", {
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
    if (user?.tier === "Enterprise") fetchTeamMembers();
  }, [user?.tier]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    const paymentRef = params.get("reference");
    const trxref = params.get("trxref");

    if (paymentRef || trxref) {
      handleVerifyPayment(paymentRef || trxref || "");
      window.history.replaceState({}, "", "/settings");
    }

    if (connected) {
      showToast(`Connected to ${connected}!`, "success");
      setLinkedAccounts(prev => new Set(prev).add(connected));
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      showToast(`Error: ${error}`, "error");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerifyPayment = async (reference: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reference, userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        const plan = data.plan;
        setActivePlan(plan as any);
        onUserUpdate({ tier: plan as any });
        showToast(data.message || `Upgraded to ${plan}!`, "success");
      } else {
        showToast(data.error || "Payment verification failed", "error");
      }
    } catch {
      showToast("Payment verification failed", "error");
    }
  };

  const handleUpgrade = useCallback(async (plan: "Pro" | "Enterprise") => {
    const token = localStorage.getItem("zyng_token");
    if (!token || !user?.email) {
      showToast("Please log in first", "error");
      return;
    }

    setLinkingPlan(plan);

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.toLowerCase(), email: user.email }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.error || "Failed to initialize payment", "error");
        setLinkingPlan(null);
        return;
      }

      if (data.test_mode) {
        // Persist to server DB even in test mode
        await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference: "test_mode", userId: user.id }),
        });
        onUserUpdate({ tier: plan });
        setActivePlan(plan);
        showToast(`Switched to ${plan} (test mode — set Paystack keys for real payments)`, "success");
        setLinkingPlan(null);
        return;
      }

      await loadPaystackScript();

      const popup = window.PaystackPop.setup({
        key: data.public_key,
        email: user.email,
        amount: plan === "Pro" ? 1200000 : 5000000,
        currency: "NGN",
        ref: data.reference,
        metadata: { plan },
        callback: (response: any) => {
          handleVerifyPayment(response.reference);
          setLinkingPlan(null);
        },
        onClose: () => {
          setLinkingPlan(null);
          showToast("Payment cancelled", "error");
        },
      });
      popup.openIframe();
    } catch (err: any) {
      showToast(err.message || "Payment failed", "error");
      setLinkingPlan(null);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profileName }),
      });
      const data = await res.json();
      if (data.success) {
        onUserUpdate({ name: profileName });
        showToast("Profile updated", "success");
      } else {
        showToast(data.error || "Failed to update profile", "error");
      }
    } catch {
      showToast("Failed to update profile", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    if (password.newPass.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(password),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password changed", "success");
        setPassword({ current: "", newPass: "" });
      } else {
        showToast(data.error || "Failed to change password", "error");
      }
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const fetchTeamMembers = async () => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    setTeamLoading(true);
    try {
      const res = await fetch("/api/team/members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTeamMembers(data.members);
    } catch {
      console.error("Failed to fetch team");
    } finally {
      setTeamLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setInviteEmail("");
        fetchTeamMembers();
      } else {
        showToast(data.error || "Failed to invite", "error");
      }
    } catch {
      showToast("Failed to invite", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/team/members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Member removed", "success");
        fetchTeamMembers();
      } else {
        showToast(data.error || "Failed to remove", "error");
      }
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const handleConnect = async (networkId: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    setConnectingNetwork(networkId);
    try {
      const res = await fetch(`/api/oauth/${networkId}/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { success: false, error: text.substring(0, 200) }; }
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error("OAuth connect failed:", data);
        showToast(data.error || `Failed to connect to ${networkId}`, "error");
        setConnectingNetwork(null);
      }
    } catch (e) {
      console.error("Failed to start OAuth", e);
      showToast(`Connection error: ${(e as any)?.message || e}`, "error");
      setConnectingNetwork(null);
    }
  };

  const handleDisconnect = async (networkId: string) => {
    const token = localStorage.getItem("zyng_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/oauth/accounts/${networkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("[Disconnect] response:", data);
      if (data.success) {
        setLinkedAccounts(prev => {
          const next = new Set(prev);
          next.delete(networkId);
          return next;
        });
        showToast(`Disconnected from ${networkId}`, "success");
      } else {
        showToast(`Disconnect failed: ${data.error}`, "error");
      }
    } catch (e) {
      console.error("Failed to disconnect", e);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-fade-in text-slate-200" id="zyng-view-settings">
      
      {/* 1. Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="border-b border-slate-850 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">Profile</h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Edit your name and password</p>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Email</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Display Name</label>
            <div className="flex items-center gap-2">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Your name"
              />
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 cursor-pointer"
              >
                {profileSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Change Password</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword(prev => ({ ...prev, current: e.target.value }))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Current password"
              />
              <input
                type="password"
                value={password.newPass}
                onChange={(e) => setPassword(prev => ({ ...prev, newPass: e.target.value }))}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="New password (8+ chars)"
              />
              <button
                onClick={handleChangePassword}
                disabled={passwordSaving || !password.current || !password.newPass}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:cursor-not-allowed text-xs font-semibold rounded-xl text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                {passwordSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Plan Selection */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Zyng Subscription Plans
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a plan and pay securely with Paystack.
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
              <p className="text-[20px] font-bold font-mono text-slate-100">
                <span className="text-xs text-slate-500">NGN</span> 0
              </p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> 10 posts / month</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> 2 connected channels</li>
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
              <p className="text-[20px] font-bold font-mono text-indigo-300">
                <span className="text-xs text-indigo-400">NGN</span> 12,000
                <span className="text-xs text-indigo-400 font-normal">/month</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Unlimited scheduling</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> All cross-posting platforms</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> WhatsApp Status automation</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Gemini AI operational suite</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleUpgrade("Pro")}
              disabled={linkingPlan === "Pro"}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-xs font-semibold rounded-xl text-white shadow-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {linkingPlan === "Pro" ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
              ) : user?.tier === "Pro" ? (
                <><Zap className="h-3.5 w-3.5" /> Active Pro Plan</>
              ) : (
                <><CreditCard className="h-3.5 w-3.5" /> Upgrade to Pro</>
              )}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={`border rounded-2xl p-6 flex flex-col justify-between ${
            activePlan === "Enterprise" ? "bg-slate-900 border-indigo-500 shadow-md" : "bg-slate-950 border-slate-900"
          }`}>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-violet-400 uppercase block font-bold">Scale</span>
              <h4 className="text-lg font-bold text-slate-200">Enterprise</h4>
              <p className="text-[20px] font-bold font-mono text-slate-100">
                <span className="text-xs text-slate-500">NGN</span> 50,000
                <span className="text-xs text-slate-500 font-normal">/month</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-2 pt-2">
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Everything in Pro</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Multiple team accounts</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> White-label configuration</li>
                <li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> API access</li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleUpgrade("Enterprise")}
              disabled={linkingPlan === "Enterprise"}
              className="mt-6 w-full py-2 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-800 disabled:cursor-not-allowed text-xs font-semibold rounded-xl border border-slate-850 cursor-pointer flex items-center justify-center gap-2"
            >
              {linkingPlan === "Enterprise" ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
              ) : user?.tier === "Enterprise" ? (
                <><Zap className="h-3.5 w-3.5" /> Active Plan</>
              ) : (
                <><ExternalLink className="h-3.5 w-3.5" /> Upgrade to Enterprise</>
              )}
            </button>
          </div>

        </div>

        {toast && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
            toastType === "success" 
              ? "bg-emerald-950 border border-emerald-500/30 text-emerald-400" 
              : "bg-rose-950 border border-rose-500/30 text-rose-400"
          }`}>
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

      </div>

      {/* 3. Team Management (Enterprise only) */}
      {user?.tier === "Enterprise" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="border-b border-slate-850 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-slate-200">Team Management</h4>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Invite members to your Enterprise team</p>
          </div>

          {/* Invite form */}
          <div className="flex items-end gap-2 mb-6 max-w-lg">
            <div className="flex-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Email</label>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 cursor-pointer"
            >
              {inviting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Invite
            </button>
          </div>

          {/* Members list */}
          {teamLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-200">{member.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-violet-400 uppercase">{member.role}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          member.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">No team members yet. Invite someone to get started.</p>
          )}
        </div>
      )}

      {/* 4. Connected Accounts Manager */}
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
