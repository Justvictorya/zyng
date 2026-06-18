export type DialectType = "english" | "pidgin" | "yoruba" | "hausa" | "igbo";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: "Free" | "Pro" | "Enterprise";
  joined: string;
  avatar: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string;
  platforms: string;
  media_urls: string;
  schedule_time: string;
  status: "draft" | "scheduled" | "published" | "failed";
  created_at: string;
}

export interface AIResponse {
  success: boolean;
  caption: string;
  hashtags: string[];
  bestTime: string;
  rationale: string;
}

export interface AIFixerResponse {
  success: boolean;
  fixedText: string;
  changesMade: string;
}

export interface AIVibeResponse {
  success: boolean;
  switchedText: string;
}

export interface AIFlagResponse {
  success: boolean;
  riskRating: string;
  score: string;
  flaggedTerms: string[];
  suggestions: string[];
}

export interface AIViralResponse {
  success: boolean;
  extractedHook: string;
  ideas: string[];
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string;
  platform_user_name: string;
  access_token: string;
  token_expires_at: string | null;
  created_at: string;
}
