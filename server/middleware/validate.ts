import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createPostSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(5000),
  platforms: z.union([z.string(), z.array(z.string())]),
  media_urls: z.union([z.string(), z.array(z.string())]).optional(),
  platform_captions: z.record(z.string(), z.string()).optional(),
  platform_schedule: z.record(z.string(), z.string()).optional(),
  schedule_time: z.string().optional(),
});

export const updatePostSchema = z.object({
  caption: z.string().min(1).max(5000).optional(),
  platforms: z.union([z.string(), z.array(z.string())]).optional(),
  media_urls: z.union([z.string(), z.array(z.string())]).optional(),
  platform_captions: z.record(z.string(), z.string()).optional(),
  platform_schedule: z.record(z.string(), z.string()).optional(),
  schedule_time: z.string().optional(),
});

export const aiGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  platforms: z.union([z.string(), z.array(z.string())]).optional(),
  tone: z.string().optional(),
});

export const aiFixSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

export const aiVibeSchema = z.object({
  text: z.string().min(1, "Text is required"),
  targetVibe: z.string().min(1, "Target vibe is required"),
});

export const aiViralSchema = z.object({
  url: z.string().min(1, "URL is required"),
});
