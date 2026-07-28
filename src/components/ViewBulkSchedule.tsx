import React, { useState, useRef } from "react";
import { Upload, FileText, X, Check, AlertCircle, Loader2, Calendar, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useZyng, ensureValidToken } from "../context/ZyngContext";

interface ParsedRow {
  caption: string;
  platforms: string;
  schedule_time: string;
}

interface BulkResult {
  created: number;
  errors: { index: number; error: string }[];
}

const PLATFORM_OPTIONS = ["Twitter", "Facebook", "Instagram", "TikTok", "LinkedIn", "YouTube", "WhatsApp"];

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const captionIdx = header.findIndex(h => h === "caption" || h === "text" || h === "content");
  const platformIdx = header.findIndex(h => h === "platforms" || h === "platform");
  const scheduleIdx = header.findIndex(h => h === "schedule_time" || h === "schedule" || h === "date" || h === "time");

  if (captionIdx === -1 || platformIdx === -1) return [];

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    return {
      caption: cols[captionIdx] || "",
      platforms: cols[platformIdx] || "",
      schedule_time: scheduleIdx >= 0 ? cols[scheduleIdx] || "" : "",
    };
  });
}

export default function ViewBulkSchedule() {
  const { currentUser: user, loadPosts } = useZyng();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [parseError, setParseError] = useState("");

  if (user?.tier === "Free") {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Bulk Schedule</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Lock className="h-8 w-8 text-amber-400 mx-auto" />
          <p className="text-sm text-slate-400">Bulk scheduling is a Pro feature.</p>
          <button onClick={() => navigate("/dashboard/settings")} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">Upgrade to Pro</button>
        </div>
      </div>
    );
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setParseError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setParseError("Could not parse CSV. Ensure headers include 'caption' and 'platforms'.");
      } else {
        setParsed(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkCreate = async () => {
    if (parsed.length === 0) return;
    setLoading(true);
    try {
      const token = await ensureValidToken();
      if (!token) return;

      const posts = parsed.map(row => ({
        caption: row.caption,
        platforms: row.platforms,
        schedule_time: row.schedule_time ? new Date(row.schedule_time).toISOString() : null,
      }));

      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ posts }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ created: data.created, errors: data.errors || [] });
        loadPosts();
      }
    } catch (err) {
      console.error("Bulk create failed", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCsvText("");
    setParsed([]);
    setFileName("");
    setResult(null);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in text-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Bulk Schedule</h2>
        </div>
        {parsed.length > 0 && !result && (
          <span className="text-[10px] font-mono text-slate-500">{parsed.length} posts ready</span>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
        <p className="text-xs text-slate-300 font-mono uppercase tracking-wider font-bold">CSV Format</p>
        <p className="text-[11px] text-slate-400">Required columns: <code className="text-indigo-400">caption</code>, <code className="text-indigo-400">platforms</code> (comma-separated).</p>
        <p className="text-[11px] text-slate-400">Optional: <code className="text-indigo-400">schedule_time</code> (ISO date like 2026-08-01T09:00:00).</p>
        <p className="text-[10px] text-slate-500 mt-2">Example: <code className="text-slate-400">caption,platforms,schedule_time</code></p>
        <p className="text-[10px] text-slate-500"><code className="text-slate-400">"Check out our sale!",Twitter/Instagram,2026-08-01T09:00:00</code></p>
      </div>

      {/* Upload area */}
      {!result ? (
        <>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />

          {!csvText ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-12 flex flex-col items-center gap-3 transition-all cursor-pointer"
            >
              <Upload className="h-8 w-8 text-slate-500" />
              <span className="text-sm text-slate-400">Click to upload CSV</span>
              <span className="text-[10px] text-slate-600">.csv files only</span>
            </button>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs text-slate-300">{fileName}</span>
                  <span className="text-[10px] font-mono text-slate-500">{parsed.length} rows</span>
                </div>
                <button onClick={reset} className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              {parseError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300">{parseError}</p>
                </div>
              ) : (
                <>
                  {/* Preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-3 border-b border-slate-800">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Preview (first 10)</span>
                    </div>
                    <div className="divide-y divide-slate-800 max-h-[300px] overflow-y-auto">
                      {parsed.slice(0, 10).map((row, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="text-[9px] font-mono text-slate-600 mt-0.5 w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-300 truncate">{row.caption}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-mono text-indigo-400">{row.platforms}</span>
                              {row.schedule_time && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  <Calendar className="inline h-2.5 w-2.5 mr-0.5" />
                                  {new Date(row.schedule_time).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleBulkCreate}
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Schedule {parsed.length} Posts
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        /* Result */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 text-center">
          <Check className="h-10 w-10 text-emerald-400 mx-auto" />
          <p className="text-sm text-white font-bold">{result.created} posts scheduled</p>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] text-red-400">{result.errors.length} errors:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-[10px] text-slate-500">Row {e.index + 1}: {e.error}</p>
              ))}
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={reset} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer">Upload Another</button>
            <button onClick={() => navigate("/dashboard/posts")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer">View Posts</button>
          </div>
        </div>
      )}
    </div>
  );
}
