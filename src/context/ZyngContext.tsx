import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { UserProfile, Post, DialectType } from "../types";

function decodeJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

async function ensureValidToken(): Promise<string | null> {
  const token = localStorage.getItem("zyng_token");
  const refreshToken = localStorage.getItem("zyng_refresh_token");
  if (!token) return null;
  if (!isTokenExpired(token)) return token;

  // Token expired — try refreshing via auth endpoint
  if (refreshToken) {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("zyng_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("zyng_refresh_token", data.refresh_token);
        }
        return data.access_token;
      }
    } catch (e) {
      console.warn("Token refresh failed", e);
    }
  }

  localStorage.removeItem("zyng_token");
  localStorage.removeItem("zyng_refresh_token");
  localStorage.removeItem("zyng_user");
  return null;
}

interface ZyngContextValue {
  currentUser: UserProfile | null;
  setCurrentUser: (u: UserProfile | null) => void;
  dialect: DialectType;
  setDialect: (d: DialectType) => void;
  posts: Post[];
  loadPosts: () => Promise<void>;
  isPostsLoading: boolean;
  nepaDraftActive: boolean;
  setNepaDraftActive: (a: boolean) => void;
  triggerDraftRecoverSignal: boolean;
  setTriggerDraftRecoverSignal: (a: boolean) => void;
  handleLogout: () => void;
  handlePostDeleted: (id: string) => void;
  handlePostUpdated: (id: string, fields: Partial<Post>) => void;
  handleUserUpdate: (fields: Partial<UserProfile>) => void;
}

const ZyngContext = createContext<ZyngContextValue | null>(null);

export function ZyngProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("zyng_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dialect, setDialect] = useState<DialectType>("english");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [nepaDraftActive, setNepaDraftActive] = useState(false);
  const [triggerDraftRecoverSignal, setTriggerDraftRecoverSignal] = useState(false);

  // Check token validity on mount
  useEffect(() => {
    ensureValidToken().then((token) => {
      if (!token && currentUser) {
        setCurrentUser(null);
      }
    });
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("zyng_nepa_draft");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.caption && parsed.caption.trim().length > 3) {
          setNepaDraftActive(true);
        }
      } catch {}
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setIsPostsLoading(true);
    try {
      const token = await ensureValidToken();
      if (!token) return;
      const res = await fetch("/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch (e) {
      console.error("Failed to fetch posts:", e);
    } finally {
      setIsPostsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("zyng_user");
    localStorage.removeItem("zyng_token");
    localStorage.removeItem("zyng_refresh_token");
  };

  const handlePostDeleted = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handlePostUpdated = (id: string, fields: Partial<Post>) => {
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...fields } : p)));
  };

  const handleUserUpdate = (fields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const next = { ...currentUser, ...fields } as UserProfile;
    setCurrentUser(next);
    localStorage.setItem("zyng_user", JSON.stringify(next));
  };

  return (
    <ZyngContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        dialect,
        setDialect,
        posts,
        loadPosts,
        isPostsLoading,
        nepaDraftActive,
        setNepaDraftActive,
        triggerDraftRecoverSignal,
        setTriggerDraftRecoverSignal,
        handleLogout,
        handlePostDeleted,
        handlePostUpdated,
        handleUserUpdate,
      }}
    >
      {children}
    </ZyngContext.Provider>
  );
}

export { ensureValidToken };

export function useZyng(): ZyngContextValue {
  const ctx = useContext(ZyngContext);
  if (!ctx) throw new Error("useZyng must be used within ZyngProvider");
  return ctx;
}
