export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  tier: "Free" | "Pro" | "Enterprise";
  joined: string;
  balance_naira: number;
}

export interface Post {
  id: string;
  created_at: string;
  user_id: string;
  caption: string;
  platforms: string;
  media_urls: string;
  schedule_time: string;
  status: "scheduled" | "published" | "draft";
}

export type DialectType = "english" | "pidgin" | "yoruba" | "hausa" | "igbo";

export interface AIResponse {
  caption?: string;
  hashtags?: string[];
  bestTime?: string;
  rationale?: string;
}

export interface AIFixerResponse {
  fixedText: string;
  changesMade: string;
}

export interface AIFlagResponse {
  riskRating: "Low" | "Medium" | "High";
  score: string;
  flaggedTerms: string[];
  suggestions: string[];
}

export interface AIViralResponse {
  extractedHook: string;
  ideas: string[];
}
