import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({
      apiKey: env("GEMINI_API_KEY"),
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return _ai;
}
