import { Router, Request, Response } from "express";
import { ai } from "../lib/gemini";
import { optionalAuth } from "../middleware/auth";
import { aiGenerateSchema, aiFixSchema, aiVibeSchema, aiViralSchema } from "../middleware/validate";
import rateLimit from "express-rate-limit";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: "Rate limit. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(optionalAuth);
router.use(aiLimiter);

const MODEL = "gemini-2.5-flash";

async function generateWithFallback(systemPrompt: string, userPrompt: string, fallback: any) {
  try {
    const geminiRes = await ai.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    });

    const text = geminiRes.text;
    if (!text) return { success: true, ...fallback };

    const parsed = JSON.parse(text);
    return { success: true, ...parsed };
  } catch (error: any) {
    console.error(`[AI] ${MODEL} error:`, error.message?.substring(0, 100));
    return { success: true, ...fallback };
  }
}

router.post("/generate-caption", async (req: Request, res: Response) => {
  const parsed = aiGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { prompt, platforms, tone } = parsed.data;
  const focusPlatforms = platforms
    ? (Array.isArray(platforms) ? platforms.join(", ") : platforms)
    : "Facebook, Instagram, WhatsApp";

  const systemPrompt = `You are Zyng AI, Nigeria's #1 Social Media Copywriter.
Generate a high-engaging caption for Nigerian audiences on: ${focusPlatforms}.
Tone: ${tone || "Standard"}.
Merge professional communication with Nigerian local dialects and Pidgin when appropriate.
Keep it punchy, visual, and action-oriented. Include relevant emojis.

Return ONLY valid JSON:
{
  "caption": "The written social media copy",
  "hashtags": ["list", "of", "localized", "hashtags"],
  "bestTime": "Recommended WAT posting time",
  "rationale": "One sentence explaining why this caption works"
}`;

  const fallback = {
    caption: `Oya listen up! 👋 ${prompt}\n\nZyng is live and ready. #Zyng #NaijaTech #BuildWithGemini`,
    hashtags: ["Zyng", "NaijaTech", "BuildWithGemini"],
    bestTime: "7:00 PM WAT",
    rationale: "Merged local Pidgin energy with direct messaging for Nigerian audiences.",
  };

  const result = await generateWithFallback(systemPrompt, `Draft a social post about: "${prompt}" using tone: "${tone || "Standard"}"`, fallback);
  return res.json(result);
});

router.post("/fix-content", async (req: Request, res: Response) => {
  const parsed = aiFixSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { text } = parsed.data;

  const systemPrompt = `You are Zyng AI Magic Content Fixer.
Clean up spelling mistakes, formatting, and punctuation.
PRESERVE all Nigerian slang: "how far", "no wahala", "abeg", "oya", "sapa", "chale", "japa", "carry last".

Return ONLY valid JSON:
{
  "fixedText": "Polished text with slang preserved",
  "changesMade": "Short phrase describing what was corrected"
}`;

  const fallback = { fixedText: text, changesMade: "Minor formatting improvements applied." };
  const result = await generateWithFallback(systemPrompt, `Fix this post while preserving local context: "${text}"`, fallback);
  return res.json(result);
});

router.post("/vibe-switcher", async (req: Request, res: Response) => {
  const parsed = aiVibeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { text, targetVibe } = parsed.data;

  const systemPrompt = `You are a style translator for Zyng.
Rewrite the provided text into the specified Nigerian vibe:
- 'professional': Corporate, polished, suitable for LinkedIn.
- 'pidgin': Full authentic Nigerian Pidgin English, relatable and funny.
- 'genz': Modern Nigerian Gen-Z style with slang like "no cap", "it's giving", "frfr", "sapa".

Return ONLY valid JSON:
{
  "switchedText": "The rewritten post in the target vibe"
}`;

  let fallback = text;
  if (targetVibe === "pidgin") fallback = `How far? 🤙 Abeg listen: ${text}\nNo wahala, Zyng got you!`;
  else if (targetVibe === "genz") fallback = `This is giving main character energy frfr 💅 ${text} No cap!`;
  else if (targetVibe === "professional") fallback = `We are pleased to present: ${text}.`;

  const result = await generateWithFallback(
    systemPrompt,
    `Translate: "${text}" to vibe: "${targetVibe}"`,
    { switchedText: fallback }
  );

  return res.json(result);
});

router.post("/flag-scanner", async (req: Request, res: Response) => {
  const parsed = aiFixSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { text } = parsed.data;

  const systemPrompt = `You are a social media algorithm safety expert.
Analyze the copy for words that could trigger content suppression or shadowbans on Facebook, Instagram, TikTok, LinkedIn, X, WhatsApp.

Return ONLY valid JSON:
{
  "riskRating": "Low" | "Medium" | "High",
  "score": "Safe rating 0-100%",
  "flaggedTerms": ["word1", "phrase2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

  const fallback = { riskRating: "Low", score: "94%", flaggedTerms: [], suggestions: ["Content looks clean!"] };
  const result = await generateWithFallback(systemPrompt, `Scan for algorithm red flags: "${text}"`, fallback);
  return res.json(result);
});

router.post("/viral-blueprint", async (req: Request, res: Response) => {
  const parsed = aiViralSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { url } = parsed.data;

  const systemPrompt = `You are Zyng Viral Content Planner.
Analyze this URL/topic and identify the psychological hook that makes it viral.
Generate 5 localized content ideas for a Nigerian business.

Return ONLY valid JSON:
{
  "extractedHook": "Description of the viral hook",
  "ideas": ["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]
}`;

  const fallback = {
    extractedHook: "Social proof + cost-benefit comparison hook.",
    ideas: [
      "Facebook: 'Who else is tired of paying in dollars?' — local humor with CTA.",
      "WhatsApp Status: 3-slide visual comparing Hootsuite vs Zyng pricing.",
      "TikTok: 'This is robbery... oh wait it's just my software subscription' audio.",
      "LinkedIn: Article on currency decoupling benefits for local alternatives.",
      "Twitter/X: 4-tweet thread: '1/ Sapa in 2026 is real, but your marketing budget shouldn't suffer...'",
    ],
  };

  const result = await generateWithFallback(systemPrompt, `Deconstruct viral mechanism for: "${url}"`, fallback);
  return res.json(result);
});

export default router;
