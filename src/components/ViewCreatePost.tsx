import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Calendar, 
  Layers, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MessageSquare, 
  CheckCircle, 
  Wand2, 
  Scale, 
  AlertTriangle, 
  Link2, 
  Loader2, 
  Trash2, 
  Bookmark,
  Languages,
  Zap,
  Check,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  ThumbsUp,
  Eye,
  ImageUp,
  X,
  Film,
  FileImage
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Post, AIResponse, AIFixerResponse, AIFlagResponse, AIViralResponse } from "../types";
import { translations } from "../lib/translations";
import { useZyng } from "../context/ZyngContext";

export default function ViewCreatePost() {
  const { dialect, setNepaDraftActive, triggerDraftRecoverSignal, setTriggerDraftRecoverSignal, loadPosts } = useZyng();
  const navigate = useNavigate();
  const t = translations[dialect];

  // Base composer states
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [nepaProofHold, setNepaProofHold] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Zyng AI Copilot active tab
  const [activeCopilotTab, setActiveCopilotTab] = useState<"caption" | "fixer" | "vibe" | "scanner" | "viral">("caption");

  // AI Operation individual states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("slang"); // standard | slang | storyteller | professional
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [captionOutput, setCaptionOutput] = useState<AIResponse | null>(null);

  // Content Fixer States
  const [isFixerLoading, setIsFixerLoading] = useState(false);
  const [fixerOutput, setFixerOutput] = useState<AIFixerResponse | null>(null);

  // Vibe Switcher States
  const [isVibeLoading, setIsVibeLoading] = useState(false);
  const [vibeOutput, setVibeOutput] = useState<string | null>(null);

  // Flag Scanner States
  const [isScannerLoading, setIsScannerLoading] = useState(false);
  const [scannerOutput, setScannerOutput] = useState<AIFlagResponse | null>(null);

  // Viral Blueprint States
  const [viralUrl, setViralUrl] = useState("");
  const [isViralLoading, setIsViralLoading] = useState(false);
  const [viralOutput, setViralOutput] = useState<AIViralResponse | null>(null);

  // Draft management states
  const [drafts, setDrafts] = useState<{id: string; caption: string; platforms: string[]; scheduleTime: string; savedAt: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem("zyng_drafts") || "[]"); } catch { return []; }
  });
  const [showDrafts, setShowDrafts] = useState(false);

  // Connected accounts state
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("zyng_user");
    if (!savedUser) return;
    const uid = JSON.parse(savedUser).id;
    fetch(`/api/auth/accounts?user_id=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setConnectedPlatforms(data.accounts.map((a: any) => a.platform));
      })
      .catch(() => {});
  }, []);

  // Media upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(newFiles);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setMediaPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 1. NEPA-Proof automatic draft hold: Listen to key entries and auto-save
  useEffect(() => {
    if (nepaProofHold) {
      const draftData = {
        caption,
        platforms: selectedPlatforms,
        scheduleTime
      };
      localStorage.setItem("zyng_nepa_draft", JSON.stringify(draftData));
      setNepaDraftActive(caption.trim().length > 3);
    } else {
      localStorage.removeItem("zyng_nepa_draft");
      setNepaDraftActive(false);
    }
  }, [caption, selectedPlatforms, scheduleTime, nepaProofHold]);

  // Handle outside signal to recover draft
  useEffect(() => {
    if (triggerDraftRecoverSignal) {
      const cached = localStorage.getItem("zyng_nepa_draft");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.caption) setCaption(parsed.caption);
          if (parsed.platforms) setSelectedPlatforms(parsed.platforms);
          if (parsed.scheduleTime) setScheduleTime(parsed.scheduleTime);
          
          setSuccessMessage("NEPA-Proof Draft recovered successfully!");
          setTimeout(() => setSuccessMessage(""), 4000);
        } catch (e) {
          console.error("Failed to recover draft cache", e);
        }
      }
      setTriggerDraftRecoverSignal(false);
    }
  }, [triggerDraftRecoverSignal]);

  // Set default schedule time (2 hours from now)
  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    // Format to local input string 'YYYY-MM-DDTHH:MM'
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().substring(0, 16);
    setScheduleTime(localISOTime);
  }, []);

  // Platform selector options with active style helpers
  const platformOptions = [
    { id: "facebook", label: "Facebook", icon: Facebook, color: "blue", activeClass: "bg-blue-900/40 border-blue-500/80 text-blue-200 ring-2 ring-blue-500/20" },
    { id: "instagram", label: "Instagram", icon: Instagram, color: "pink", activeClass: "bg-pink-900/40 border-pink-500/80 text-pink-200 ring-2 ring-pink-500/20" },
    { id: "tiktok", label: "TikTok", icon: MessageSquare, color: "black", activeClass: "bg-neutral-800/80 border-slate-400 text-white ring-2 ring-slate-400/25" },
    { id: "twitter", label: "X / Twitter", icon: Twitter, color: "gray", activeClass: "bg-slate-900 border-slate-500 text-slate-100 ring-2 ring-slate-400/20" },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "indigo", activeClass: "bg-indigo-900/40 border-indigo-500/80 text-indigo-200 ring-2 ring-indigo-500/20" },
    { id: "whatsapp", label: "WhatsApp Status", icon: MessageSquare, color: "green", activeClass: "bg-emerald-950 border-emerald-500 text-emerald-250 ring-2 ring-emerald-500/35" },
    { id: "youtube", label: "YouTube", icon: Youtube, color: "red", activeClass: "bg-red-950 border-red-500/80 text-red-200 ring-2 ring-red-500/20" }
  ];

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  // --- API SERVICE CALLS ---

  // Generate Caption
  const handleGenerateCaption = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    setCaptionOutput(null);
    try {
      const res = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          platforms: selectedPlatforms,
          tone: aiTone
        })
      });
      const data = await res.json();
      if (data.success) {
        setCaptionOutput(data);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run Content Slang Grammar Fixer
  const handleFixContent = async () => {
    if (!caption) {
      setErrorMessage("Please input some original copy in the main writer box first!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsFixerLoading(true);
    setFixerOutput(null);
    try {
      const res = await fetch("/api/ai/fix-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: caption })
      });
      const data = await res.json();
      if (data.success) {
        setFixerOutput(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFixerLoading(false);
    }
  };

  // Vibe Switcher
  const handleSwitchVibe = async (targetVibe: "professional" | "pidgin" | "genz") => {
    if (!caption) {
      setErrorMessage("Compose some text in the main body composer first to switch its vibe!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsVibeLoading(true);
    setVibeOutput(null);
    try {
      const res = await fetch("/api/ai/vibe-switcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: caption, targetVibe })
      });
      const data = await res.json();
      if (data.success) {
        setVibeOutput(data.switchedText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVibeLoading(false);
    }
  };

  // Algorithm suppressed scanner
  const handleScanAlgorithm = async () => {
    if (!caption) {
      setErrorMessage("Draft some copy in the composer field to run the algorithm audit!");
      setTimeout(() => setErrorMessage(""), 3005);
      return;
    }
    setIsScannerLoading(true);
    setScannerOutput(null);
    try {
      const res = await fetch("/api/ai/flag-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: caption })
      });
      const data = await res.json();
      if (data.success) {
        setScannerOutput(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScannerLoading(false);
    }
  };

  // Viral link psychological hook extractor
  const handleViralAnalysis = async () => {
    if (!viralUrl) return;
    setIsViralLoading(true);
    setViralOutput(null);
    try {
      const res = await fetch("/api/ai/viral-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: viralUrl })
      });
      const data = await res.json();
      if (data.success) {
        setViralOutput(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsViralLoading(false);
    }
  };

  // Draft management functions
  const saveDraft = () => {
    if (!caption.trim()) {
      setErrorMessage("Cannot save an empty draft!");
      setTimeout(() => setErrorMessage(""), 2000);
      return;
    }
    const newDraft = {
      id: Date.now().toString(),
      caption,
      platforms: selectedPlatforms,
      scheduleTime,
      savedAt: new Date().toISOString()
    };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem("zyng_drafts", JSON.stringify(updated));
    setSuccessMessage("Draft saved!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const loadDraft = (draft: {id: string; caption: string; platforms: string[]; scheduleTime: string; savedAt: string}) => {
    setCaption(draft.caption);
    setSelectedPlatforms(draft.platforms);
    setScheduleTime(draft.scheduleTime);
    setSuccessMessage("Draft loaded into composer!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem("zyng_drafts", JSON.stringify(updated));
  };

  const postDraft = async (draft: {id: string; caption: string; platforms: string[]; scheduleTime: string; savedAt: string}) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: draft.caption,
          platforms: draft.platforms,
          schedule_time: draft.scheduleTime || new Date(Date.now() + 3600000).toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        deleteDraft(draft.id);
        setSuccessMessage("Draft posted successfully!");
        setTimeout(() => { setSuccessMessage(""); loadPosts(); navigate("/dashboard/posts"); }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to post draft");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Upload a single file (chunked if > 50MB)
  const uploadSingleFile = async (file: File): Promise<string> => {
    // Files under 50MB use simple upload
    if (file.size <= 50 * 1024 * 1024) {
      const formData = new FormData();
      formData.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.urls[0];
    }

    // Large files use chunked upload
    const CHUNK_SIZE = 50 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("fileId", fileId);
      formData.append("chunkIndex", String(i));
      formData.append("totalChunks", String(totalChunks));
      formData.append("originalName", file.name);
      formData.append("mimeType", file.type);

      const res = await fetch("/api/upload/chunk", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(`Chunk ${i} failed: ${data.error}`);
    }

    // Complete the upload
    const completeRes = await fetch("/api/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, originalName: file.name, mimeType: file.type }),
    });
    const completeData = await completeRes.json();
    if (!completeData.success) throw new Error(completeData.error);
    return completeData.url;
  };

  // Upload all files and return URLs
  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return mediaUrls;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const url = await uploadSingleFile(selectedFiles[i]);
        urls.push(url);
      }
      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  // Main Submit handler (Schedules the post in back-end db)
  const handleSavePost = async () => {
    if (!caption.trim()) {
      setErrorMessage("Can't schedule an empty post! Please type a caption first.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMessage("Please select at least 1 platform target card!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const urls = await uploadFiles();

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          platforms: selectedPlatforms,
          media_urls: urls,
          schedule_time: scheduleTime || new Date(Date.now() + 3600000).toISOString()
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(t.postSaved);
        setCaption("");
        setSelectedFiles([]);
        setMediaPreviews((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return []; });
        setMediaUrls([]);
        const now = new Date();
        now.setHours(now.getHours() + 2);
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = new Date(now.getTime() - offset).toISOString().substring(0, 16);
        setScheduleTime(localISOTime);
        
        localStorage.removeItem("zyng_nepa_draft");
        setNepaDraftActive(false);

        setTimeout(() => {
          setSuccessMessage("");
          loadPosts();
          navigate("/dashboard/posts");
        }, 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to schedule post");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8" id="zyng-view-create-post">
      
      {/* SUCCESS & ERROR OVERLAYS ENVELOPE */}
      {successMessage && (
        <div className="lg:col-span-12 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-xl px-5 py-4 text-xs font-semibold flex items-center gap-3 shadow-xl animate-bounce" id="create-success-message">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="lg:col-span-12 bg-rose-950 border border-rose-500/40 text-rose-300 rounded-xl px-5 py-4 text-xs font-semibold flex items-center gap-3 shadow-xl" id="create-error-message">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* LEFT COLUMN: THE MAIN CAMPAIGN WRITER */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6.5 space-y-6 flex flex-col justify-between shadow-lg" id="writer-core-pane">
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 tracking-tight uppercase font-mono">
              Main Social Composer
            </h3>
            
            {/* NEPA-Proof Manual Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-sans">NEPA-Proof Lock</span>
              <button 
                onClick={() => setNepaProofHold(!nepaProofHold)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  nepaProofHold ? "bg-indigo-600" : "bg-slate-800"
                }`}
                title="Toggles auto-saving current draft in localstorage cache"
                id="nepa-hold-toggle"
              >
                <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  nepaProofHold ? "translate-x-4.5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>

          {/* Caption composer textarea */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Social Copy / Caption
            </label>
            <div className="relative">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What are we announcing today? Abeg feel free to type standard copy. Switch tabs on the right to polish, fix punctuation while preserving local Pidgin slang, or write entirely with Zyng AI..."
                maxLength={2200}
                className="w-full h-52 bg-slate-950 border border-slate-800/80 rounded-xl p-4.5 text-xs text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-sans leading-relaxed resize-none shadow-inner"
                id="social-caption-textarea"
              />
              <span className="absolute bottom-3.5 right-3.5 text-[10px] font-mono text-slate-500 font-semibold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                {caption.length} / 2200
              </span>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Images & Videos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-purple-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <ImageUp className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tap to upload images or videos</p>
              <p className="text-[10px] text-slate-600 mt-1">Max 20 files, files over 50MB auto-chunked</p>
            </div>
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {mediaPreviews.map((preview, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-800">
                    {selectedFiles[i]?.type.startsWith("video/") ? (
                      <video src={preview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 h-5 w-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                    {selectedFiles[i]?.type.startsWith("video/") && (
                      <Film className="absolute bottom-1 left-1 h-3 w-3 text-white/70" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform selection cards (light up with direct brand colors) */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Select Cross-Posting Network Channels
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {platformOptions.map((plat) => {
                const isSelected = selectedPlatforms.includes(plat.id);
                const Icon = plat.icon;
                return (
                  <button
                    key={plat.id}
                    onClick={() => togglePlatform(plat.id)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-all text-left group relative cursor-pointer ${
                      isSelected 
                        ? plat.activeClass 
                        : "bg-slate-950 border-slate-850/70 text-slate-400 hover:border-slate-800 hover:text-slate-200"
                    }`}
                    id={`platform-${plat.id}`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-semibold block font-sans">{plat.label}</span>
                      <span className="text-[9px] text-slate-500 font-mono block">
                        {isSelected
                          ? "Selected"
                          : connectedPlatforms.includes(plat.id)
                            ? "Connected"
                            : "Not connected"}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-indigo-400 rounded-full"></span>
                    )}
                    {connectedPlatforms.includes(plat.id) && !isSelected && (
                      <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Previews */}
          {selectedPlatforms.length > 0 && caption.trim() && (
            <div className="space-y-2.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Post Preview
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedPlatforms.map((p) => (
                  <PreviewCard key={p} platform={p} caption={caption} />
                ))}
              </div>
            </div>
          )}

          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Broadcast Scheduler (WAT Time)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-11 pr-4.5 py-2.5 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono cursor-pointer"
                id="schedule-datetime-picker"
              />
            </div>
          </div>

          {/* Drafts Panel */}
          <div className="space-y-2">
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Saved Drafts ({drafts.length})</span>
              <Layers className={`h-3.5 w-3.5 transition-transform ${showDrafts ? "rotate-180" : ""}`} />
            </button>

            {showDrafts && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drafts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-2">No saved drafts yet. Write something and tap "Save Draft"</p>
                ) : (
                  drafts.map((d) => (
                    <div key={d.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(d.savedAt).toLocaleDateString()} {new Date(d.savedAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                        <div className="flex gap-1">
                          {d.platforms.map((pl) => {
                            const opt = platformOptions.find(o => o.id === pl);
                            const Icon = opt?.icon || MessageSquare;
                            return <Icon key={pl} className="h-3 w-3 text-slate-500" />;
                          })}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{d.caption}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => loadDraft(d)}
                          className="flex-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg py-1.5 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => postDraft(d)}
                          disabled={isSaving}
                          className="flex-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-1.5 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {isSaving ? "Posting..." : "Post Now"}
                        </button>
                        <button
                          onClick={() => deleteDraft(d.id)}
                          className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg py-1.5 px-2.5 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button trigger row */}
        <div className="pt-6 border-t border-slate-800 mt-6 flex justify-between gap-4">
          <button 
            onClick={() => {
              setCaption("");
              setSelectedFiles([]);
              setMediaPreviews((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return []; });
              setMediaUrls([]);
              localStorage.removeItem("zyng_nepa_draft");
              setNepaDraftActive(false);
            }}
            className="px-4.5 py-3 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-slate-950/20"
            title="Clear composing field completely"
            id="clear-form-btn"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={saveDraft}
            disabled={!caption.trim()}
            className="px-4.5 py-3 border border-amber-700/50 text-amber-400 hover:border-amber-600 hover:text-amber-300 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-amber-500/5 cursor-pointer disabled:opacity-30"
            title="Save current post as draft"
            id="save-draft-btn"
          >
            <Bookmark className="h-4 w-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSavePost}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            id="schedule-submit-btn"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading media files...</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scheduling Post on Central Queue...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 text-amber-300" />
                <span>{t.schedulePost} (WAT Queue)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: ZYNG COPILOT AI TOOLKIT */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg" id="ai-assistant-core-pane">
        
        <div className="flex flex-col h-full">
          {/* Header section of toolkit */}
          <div className="p-4 bg-slate-950 border-b border-slate-850/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400 shrink-0 animate-bounce" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">Zyng AI Workspace</span>
            </div>
            
            {/* Quick API check indicator */}
            <div className="flex items-center gap-1.5 hover:opacity-85 cursor-help" title="Gemini-3.5-Flash Active Agent Core">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">Gemini 3.5 Core</span>
            </div>
          </div>

          {/* Sub tab buttons for the 5 utilities */}
          <div className="grid grid-cols-5 border-b border-slate-850/50 bg-slate-950/40 text-[10px] uppercase font-bold tracking-tight font-mono text-center">
            
            <button 
              onClick={() => setActiveCopilotTab("caption")}
              className={`py-3 px-1 transition-all border-b-2 ${
                activeCopilotTab === "caption" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Writer
            </button>
            
            <button 
              onClick={() => setActiveCopilotTab("fixer")}
              className={`py-3 px-1 transition-all border-b-2 ${
                activeCopilotTab === "fixer" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Wand
            </button>

            <button 
              onClick={() => setActiveCopilotTab("vibe")}
              className={`py-3 px-1 transition-all border-b-2 ${
                activeCopilotTab === "vibe" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Vibe
            </button>

            <button 
              onClick={() => setActiveCopilotTab("scanner")}
              className={`py-3 px-1 transition-all border-b-2 ${
                activeCopilotTab === "scanner" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Scanner
            </button>

            <button 
              onClick={() => setActiveCopilotTab("viral")}
              className={`py-3 px-1 transition-all border-b-2 ${
                activeCopilotTab === "viral" ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              Viral URL
            </button>
          </div>

          {/* Active workspace pane scrollable */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5" style={{ maxHeight: "450px" }}>
            
            {/* TAB 1: GEMINI CAPTION WRITER & HASHTAGS GENERATOR */}
            {activeCopilotTab === "caption" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase">AI Social Copywriter</span>
                  <p className="text-xs text-slate-400">Describe what you want to sell/announce and Zyng will frame a targeted Naija post!</p>
                </div>

                <div className="space-y-2">
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Free delivery on orders above ₦25,000 to Abuja/Lagos residents for our organic hair cream brand..."
                    className="w-full h-18 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                    id="ai-prompt-input"
                  />
                  
                  {/* Style selector and trigger button */}
                  <div className="flex gap-2">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2.5 py-2 grow focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="slang">Street Slang / Pidgin Vibes</option>
                      <option value="storyteller">Emotional Storytelling</option>
                      <option value="professional">Corporate Lagos Pro</option>
                      <option value="funny">High Energy Humorous</option>
                    </select>

                    <button
                      onClick={handleGenerateCaption}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3.5 rounded-lg text-[11px] font-mono shrink-0 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      id="ai-generate-caption-btn"
                    >
                      {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      <span>Gen</span>
                    </button>
                  </div>
                </div>

                {/* AI Outputs display card */}
                {captionOutput && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-4 animate-fade-in shadow-lg">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Draft Caption</span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans select-all whitespace-pre-wrap whitespace-normal bg-slate-900 border border-slate-850 p-2.5 rounded-lg">
                        {captionOutput.caption}
                      </p>
                      
                      {/* CTA Button to import into composer */}
                      <button
                        onClick={() => {
                          setCaption(captionOutput.caption || "");
                          setSuccessMessage("Copied to main composer!");
                          setTimeout(() => setSuccessMessage(""), 1500);
                        }}
                        className="w-full text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-1 py-1.5 border border-dashed border-indigo-500/10 hover:border-indigo-400/30 rounded-lg bg-indigo-500/5 transition-all cursor-pointer"
                        id="apply-ai-caption-btn"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Use This Caption inside Core Writer</span>
                      </button>
                    </div>

                    {/* Hashtags display */}
                    {captionOutput.hashtags && captionOutput.hashtags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-slate-500 block uppercase">Local Hashtags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {captionOutput.hashtags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 font-mono text-[10px] rounded border border-indigo-500/20 font-semibold select-all">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const tagsJoined = captionOutput.hashtags?.map(h => `#${h}`).join(" ");
                            setCaption(prev => prev ? `${prev}\n\n${tagsJoined}` : tagsJoined || "");
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-300 underline font-medium cursor-pointer"
                        >
                          Append hashtags to main caption
                        </button>
                      </div>
                    )}

                    {/* Best Time & Rationale */}
                    {captionOutput.bestTime && (
                      <div className="grid grid-cols-2 gap-3.5 border-t border-slate-900 pt-3 text-[11px]">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Timing advice</span>
                          <span className="text-violet-300 font-medium font-sans">{captionOutput.bestTime}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Platform Fit</span>
                          <span className="text-slate-300 font-medium font-sans line-clamp-2 leading-relaxed">{captionOutput.rationale}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SLANG-PRESERVING GRAMMAR CONTENT FIXER */}
            {activeCopilotTab === "fixer" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-violet-450 font-bold block uppercase">Slang-Preserving Content Fixer</span>
                  <p className="text-xs text-slate-400">The "Magic Wand" corrects typo/line breaks in the main box while protecting native expressions (e.g. no dey carry last)!</p>
                </div>

                <button
                  onClick={handleFixContent}
                  disabled={isFixerLoading || !caption}
                  className="w-full bg-violet-600 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-900/10 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all text-xs disabled:opacity-40"
                  id="run-magic-fix-btn"
                >
                  {isFixerLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Polishing context...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 animate-pulse" />
                      <span>Scan, Polishing, Keep Dialect Slang</span>
                    </>
                  )}
                </button>

                {fixerOutput && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-3 shadow-lg select-all animate-fade-in">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Pristine Slang-Preserved Revision:</span>
                      <p className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-lg text-slate-200 mt-1 shadow-inner whitespace-pre-wrap leading-relaxed">
                        {fixerOutput.fixedText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-900 pt-3 justify-between">
                      <span className="text-[10px] text-slate-400 font-sans italic">
                        {fixerOutput.changesMade}
                      </span>
                      <button
                        onClick={() => {
                          setCaption(fixerOutput.fixedText);
                          setFixerOutput(null);
                        }}
                        className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded cursor-pointer shrink-0"
                      >
                        Apply Fix
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DIALECT VIBE SWITCHER */}
            {activeCopilotTab === "vibe" && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase">Dialect Tone Shift</span>
                  <p className="text-xs text-slate-400">Translate spelling/tone in the composer window immediately into specific local vibes.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button 
                    onClick={() => handleSwitchVibe("professional")}
                    disabled={isVibeLoading}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 py-3 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    LinkedIn Pro
                  </button>
                  <button 
                    onClick={() => handleSwitchVibe("pidgin")}
                    disabled={isVibeLoading}
                    className="bg-slate-950 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 py-3 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Naija Pidgin
                  </button>
                  <button 
                    onClick={() => handleSwitchVibe("genz")}
                    disabled={isVibeLoading}
                    className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 py-3 rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Gen-Z frfr
                  </button>
                </div>

                {isVibeLoading && (
                  <div className="flex items-center gap-2 justify-center py-4 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Modulating active vibe...</span>
                  </div>
                )}

                {vibeOutput && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-3.5 shadow-lg select-all animate-fade-in text-xs">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">Tone Shift Output</span>
                      <p className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-lg text-slate-200 mt-1 shadow-inner whitespace-pre-wrap leading-relaxed">
                        {vibeOutput}
                      </p>
                    </div>

                    <div className="flex justify-end border-t border-slate-900 pt-2.5">
                      <button
                        onClick={() => {
                          setCaption(vibeOutput);
                          setVibeOutput(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg cursor-pointer"
                      >
                        Insert switched text inside Core Composer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ALGORITHM RED FLAG SCANNER */}
            {activeCopilotTab === "scanner" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">Algorithm Suppression Scan</span>
                  <p className="text-xs text-slate-400">Runs checks on hashtags density, shadowban probability, currency triggers, or pricing traps.</p>
                </div>

                <button
                  onClick={handleScanAlgorithm}
                  disabled={isScannerLoading || !caption}
                  className="w-full bg-slate-950 border border-slate-850 hover:bg-slate-950 hover:border-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-transparent shadow"
                  id="run-suppress-scan-btn"
                >
                  {isScannerLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Auditing social protocols...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="h-4 w-4 text-cyan-400" />
                      <span>Scan suppression Risk factors</span>
                    </>
                  )}
                </button>

                {scannerOutput && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-4 animate-fade-in shadow-lg">
                    <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-lg border border-slate-850">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Safe Score</span>
                        <span className="text-base font-bold font-mono text-emerald-400">{scannerOutput.score}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Suppress Risk</span>
                        <span className={`text-xs font-bold uppercase font-mono ${
                          scannerOutput.riskRating === "High" ? "text-rose-400" :
                          scannerOutput.riskRating === "Medium" ? "text-amber-400" :
                          "text-emerald-400"
                        }`}>
                          {scannerOutput.riskRating}
                        </span>
                      </div>
                    </div>

                    {scannerOutput.flaggedTerms && scannerOutput.flaggedTerms.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-teal-400 uppercase block">Flagged Keywords</span>
                        <div className="flex flex-wrap gap-1">
                          {scannerOutput.flaggedTerms.map((term) => (
                            <span key={term} className="bg-rose-500/10 text-rose-300 font-mono text-[10px] px-2 py-0.5 rounded border border-rose-400/10">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scannerOutput.suggestions && scannerOutput.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold font-sans text-slate-300 block">Algorithmic Distribution Advice:</span>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
                          {scannerOutput.suggestions.map((s, idx) => (
                            <li key={idx} className="leading-relaxed">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: VIRAL LINK BLUEPRINT CONVERTER */}
            {activeCopilotTab === "viral" && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase">Viral Link Blueprint Hook</span>
                  <p className="text-xs text-slate-400">Paste any viral Instagram, Twitter, or TikTok url. AI extracts the underlying hook & creates exactly 5 custom localized campaign drafts!</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="url"
                      value={viralUrl}
                      onChange={(e) => setViralUrl(e.target.value)}
                      placeholder="Paste viral post url (e.g. instagram.com/reel/...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      id="viral-url-input"
                    />
                  </div>
                  
                  <button
                    onClick={handleViralAnalysis}
                    disabled={isViralLoading || !viralUrl}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg font-mono text-[11px] cursor-pointer disabled:opacity-40"
                    id="trigger-viral-analysis"
                  >
                    {isViralLoading ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Deconstruct Viral Blueprint Link"}
                  </button>
                </div>

                {viralOutput && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4.5 space-y-4 animate-fade-in shadow-lg">
                    <div className="space-y-1 border-b border-slate-900 pb-3">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Underlying Psychological Mechanism</span>
                      <p className="text-xs font-medium text-indigo-300 leading-relaxed font-sans">{viralOutput.extractedHook}</p>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider block">5 Local Customized Spin-offs:</span>
                      
                      <div className="space-y-2.5">
                        {viralOutput.ideas.map((idea, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setCaption(idea);
                              setSuccessMessage("Injected Idea directly to core writer!");
                              setTimeout(() => setSuccessMessage(""), 1500);
                            }}
                            className="bg-slate-900 border border-slate-850 hover:border-slate-700/80 p-3.5 rounded-lg text-xs leading-relaxed text-slate-300 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 text-left select-none relative group"
                          >
                            <p className="font-sans pr-4">{idea}</p>
                            <span className="absolute top-2 right-2 text-[10px] font-mono text-slate-600 group-hover:text-indigo-400 font-bold transition-colors">#{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Quick instructions Footer */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-850/65 flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-slate-500 shrink-0" />
            <span className="text-[11px] text-slate-400 font-sans">
              To test the Gemini engine, describe a product prompt in the first tab and tap Gen!
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}

function PreviewCard({ platform, caption }: { platform: string; caption: string; key?: string }) {
  const previews: Record<string, { name: string; icon: React.ReactNode; bg: string; text: string; accent: string; actions: React.ReactNode }> = {
    facebook: {
      name: "Facebook", icon: <Facebook className="h-3.5 w-3.5 text-blue-500" />,
      bg: "bg-white", text: "text-gray-800", accent: "text-blue-600",
      actions: (
        <div className="flex gap-3 text-[10px] text-gray-500 font-semibold">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Share</span>
        </div>
      )
    },
    instagram: {
      name: "Instagram", icon: <Instagram className="h-3.5 w-3.5 text-pink-500" />,
      bg: "bg-white", text: "text-gray-800", accent: "text-pink-600",
      actions: (
        <div className="flex gap-3 text-lg">
          <Heart className="h-3.5 w-3.5 text-gray-500" />
          <MessageCircle className="h-3.5 w-3.5 text-gray-500" />
          <Share2 className="h-3.5 w-3.5 text-gray-500" />
        </div>
      )
    },
    tiktok: {
      name: "TikTok", icon: <Music2 className="h-3.5 w-3.5 text-white" />,
      bg: "bg-black", text: "text-white", accent: "text-pink-400",
      actions: (
        <div className="flex gap-2 text-[10px] text-gray-300">
          <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-0.5"><Bookmark className="h-3 w-3" /></span>
        </div>
      )
    },
    twitter: {
      name: "X", icon: <Twitter className="h-3.5 w-3.5 text-sky-500" />,
      bg: "bg-black", text: "text-gray-100", accent: "text-sky-500",
      actions: (
        <div className="flex gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> 0</span>
        </div>
      )
    },
    linkedin: {
      name: "LinkedIn", icon: <Linkedin className="h-3.5 w-3.5 text-blue-600" />,
      bg: "bg-white", text: "text-gray-800", accent: "text-blue-700",
      actions: (
        <div className="flex gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Repost</span>
        </div>
      )
    },
    whatsapp: {
      name: "WhatsApp", icon: <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />,
      bg: "bg-emerald-900/80", text: "text-white", accent: "text-emerald-300",
      actions: (
        <div className="flex gap-2 text-[10px] text-emerald-200">
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Reply</span>
          <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> Forward</span>
        </div>
      )
    },
    youtube: {
      name: "YouTube", icon: <Youtube className="h-3.5 w-3.5 text-red-600" />,
      bg: "bg-zinc-900", text: "text-gray-100", accent: "text-red-500",
      actions: (
        <div className="flex gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> 0</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> 0</span>
        </div>
      )
    }
  };

  const p = previews[platform] || previews.facebook;
  const initials = "ZN";
  const timeAgo = "2m";

  return (
    <div className={`${p.bg} rounded-xl p-3 shadow-md border border-slate-700/30 space-y-2 font-sans`}>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-bold ${p.text} truncate`}>Zyng</span>
            <span className={p.accent}>{p.icon}</span>
          </div>
          <span className={`text-[9px] ${platform === "twitter" ? "text-gray-500" : "text-gray-400"} block`}>{timeAgo}</span>
        </div>
      </div>
      <p className={`text-[11px] ${p.text} leading-relaxed line-clamp-4 ${p.bg === "bg-white" ? "" : "opacity-90"}`}>
        {caption}
      </p>
      <div className={`pt-1.5 border-t ${p.bg === "bg-white" ? "border-gray-100" : "border-white/10"}`}>
        {p.actions}
      </div>
    </div>
  );
}
