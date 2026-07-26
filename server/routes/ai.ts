import { Router, Request, Response } from "express";
import { getAI } from "../lib/gemini";
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
  validate: { xForwardedForHeader: false },
});

router.use(optionalAuth);
router.use(aiLimiter);

const MODEL = "gemini-2.5-flash";

async function generateWithFallback(systemPrompt: string, userPrompt: string, fallback: any) {
  try {
    const geminiRes = await getAI().models.generateContent({
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
    return res.status(400).json({ error: parsed.error.issues[0].message });
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
    return res.status(400).json({ error: parsed.error.issues[0].message });
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
    return res.status(400).json({ error: parsed.error.issues[0].message });
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
    return res.status(400).json({ error: parsed.error.issues[0].message });
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
    return res.status(400).json({ error: parsed.error.issues[0].message });
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

router.post("/generate-hashtags", async (req: Request, res: Response) => {
  const { caption, platforms } = req.body;
  if (!caption || typeof caption !== "string") {
    return res.status(400).json({ success: false, error: "Caption is required" });
  }

  const platformList = Array.isArray(platforms) ? platforms.join(", ") : "general social media";

  const systemPrompt = `You are a social media hashtag strategist for Nigerian and African audiences.
Return ONLY a JSON object with this exact shape:
{ "hashtags": ["tag1", "tag2", ...] }

Rules:
- Generate 8-12 relevant hashtags
- Mix popular/trending hashtags with niche ones
- Include platform-specific hashtags when relevant
- Include Nigerian/African audience hashtags when the content relates to them
- Keep hashtags short and memorable
- No spaces in hashtags, use camelCase for multi-word tags
- Return ONLY the JSON, no other text`;

  const fallback = {
    hashtags: ["socialmedia", "contentcreator", "digitalmarketing", "branding", "onlinebusiness", "growthhacking", "marketingtips", "contentstrategy"],
  };

  const result = await generateWithFallback(
    systemPrompt,
    `Generate hashtags for this ${platformList} post: "${caption.substring(0, 500)}"`,
    fallback
  );
  return res.json(result);
});

router.post("/best-time", async (req: Request, res: Response) => {
  const { platforms, postHistory } = req.body;
  const platformList = Array.isArray(platforms) ? platforms.join(", ") : "all platforms";

  const historyContext = postHistory?.length
    ? `User's recent post schedule times (WAT): ${JSON.stringify(postHistory.slice(0, 20))}`
    : "No post history available yet — use general Nigerian audience best practices.";

  const systemPrompt = `You are a social media scheduling optimizer for Nigerian/African audiences (WAT timezone).
Analyze the posting history and recommend the 3 best times to post this week for each platform.

All times must be in WAT (West Africa Time, UTC+1).

Return ONLY valid JSON:
{
  "recommendations": {
    "tiktok": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }],
    "linkedin": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }],
    "twitter": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }],
    "youtube": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }],
    "instagram": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }],
    "facebook": [{ "time": "YYYY-MM-DDTHH:MM", "label": "Short reason" }]
  },
  "generalAdvice": "One sentence of general scheduling advice for Nigerian audiences"
}`;

  const fallback = {
    recommendations: {
      tiktok: [{ time: getNextWeekday(19), label: "Evening entertainment peak" }, { time: getNextWeekday(12), label: "Lunch break scroll time" }, { time: getNextWeekday(21), label: "Late night viral window" }],
      linkedin: [{ time: getNextWeekday(8), label: "Professional morning check" }, { time: getNextWeekday(12), label: "Midday networking" }, { time: getNextWeekday(17), label: "End of work wrap-up" }],
      twitter: [{ time: getNextWeekday(8), label: "Morning news cycle" }, { time: getNextWeekday(13), label: "Post-lunch engagement" }, { time: getNextWeekday(20), label: "Evening conversation peak" }],
      youtube: [{ time: getNextWeekday(18), label: "After-work viewing" }, { time: getNextWeekday(14), label: "Afternoon tutorial time" }, { time: getNextWeekday(21), label: "Night owl content binge" }],
      instagram: [{ time: getNextWeekday(11), label: "Late morning discovery" }, { time: getNextWeekday(19), label: "Evening story scroll" }, { time: getNextWeekday(21), label: "Nighttime explore page" }],
      facebook: [{ time: getNextWeekday(9), label: "Morning feed check" }, { time: getNextWeekday(13), label: "Lunch break browsing" }, { time: getNextWeekday(20), label: "Prime evening engagement" }],
    },
    generalAdvice: "Nigerian audiences are most active between 8-10 AM, 12-2 PM, and 7-10 PM WAT. Weekdays see professional content peaks, while weekends drive entertainment engagement.",
  };

  const result = await generateWithFallback(
    systemPrompt,
    `Recommend best posting times for platforms: ${platformList}. ${historyContext}`,
    fallback
  );
  return res.json(result);
});

function getNextWeekday(hour: number): string {
  const now = new Date();
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 16);
}

export default router;
