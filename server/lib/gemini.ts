import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const apiKey = env("GEMINI_API_KEY", "dummy-key");

export const ai = new GoogleGenAI({
  apiKey,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});
