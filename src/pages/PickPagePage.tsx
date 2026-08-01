import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Check, XCircle, AlertTriangle } from "lucide-react";
import { ensureValidToken } from "../context/ZyngContext";

interface PendingPage {
  id: string;
  name: string;
  igUsername?: string | null;
}

export default function PickPagePage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [platform, setPlatform] = useState<string>("facebook");
  const [pages, setPages] = useState<PendingPage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const authToken = await ensureValidToken();
      if (!authToken) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch(`/api/oauth/pending/${encodeURIComponent(token)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setPlatform(data.platform);
          setPages(data.pages || []);
          setSelected(data.pages?.[0]?.id || null);
        } else {
          setError(data.error || "Could not load your Pages. Please try connecting again.");
        }
      } catch {
        setError("Could not load your Pages. Please try connecting again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, navigate]);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const authToken = await ensureValidToken();
    if (!authToken) {
      setSaving(false);
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(`/api/oauth/pending/${encodeURIComponent(token)}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ pageId: selected }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/dashboard/settings?connected=${data.platform}`;
      } else {
        setError(data.error || "Failed to connect. Please try again.");
        setSaving(false);
      }
    } catch {
      setError("Failed to connect. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-slate-100 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-slate-100">
            {platform === "instagram" ? "Choose your Instagram account" : "Choose your Facebook Page"}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          We found more than one {platform === "instagram" ? "Page with an Instagram account" : "Page"} on your
          account. Pick which one Zyng should post to. You can change this later by reconnecting.
        </p>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        )}

        {!loading && error && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-xs bg-rose-950 border border-rose-500/30 text-rose-400 mb-4">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2 mb-6">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setSelected(page.id)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  selected === page.id
                    ? "bg-indigo-950/40 border-indigo-500 text-slate-100"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block">{page.name}</span>
                  {page.igUsername && (
                    <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                      Instagram: @{page.igUsername}
                    </span>
                  )}
                </div>
                {selected === page.id && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.assign("/dashboard/settings")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected || saving}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-xs font-semibold rounded-xl text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                </>
              ) : (
                <>Connect to {platform === "instagram" ? "Instagram" : "Facebook"}</>
              )}
            </button>
          </div>
        )}

        {!loading && error && (
          <button
            onClick={() => window.location.assign("/dashboard/settings")}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="h-3.5 w-3.5" /> Back to Settings
          </button>
        )}
      </div>
    </div>
  );
}
