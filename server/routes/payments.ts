import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { adminAuth } from "../lib/supabase";

const router = Router();

const PLANS: Record<string, { amount_kobo: number; label: string }> = {
  pro: { amount_kobo: 1200000, label: "Pro" },
  enterprise: { amount_kobo: 5000000, label: "Enterprise" },
};

function getPaystackSecret(): string | null {
  const key = env("PAYSTACK_SECRET_KEY");
  return key || null;
}

function getPaystackPublic(): string | null {
  const key = env("PAYSTACK_PUBLIC_KEY");
  return key || null;
}

router.post("/initialize", async (req: Request, res: Response) => {
  try {
    const { plan, email } = req.body;
    if (!plan || !email) {
      return res.status(400).json({ success: false, error: "plan and email required" });
    }

    const planConfig = PLANS[plan.toLowerCase()];
    if (!planConfig) {
      return res.status(400).json({ success: false, error: "Invalid plan. Use 'pro' or 'enterprise'" });
    }

    const secretKey = getPaystackSecret();
    const publicKey = getPaystackPublic();

    if (!secretKey || !publicKey) {
      return res.status(200).json({
        success: true,
        test_mode: true,
        public_key: "pk_test_unconfigured",
        plan: planConfig.label,
        message: "Paystack not configured — running in test mode. Set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY in .env to enable real payments.",
      });
    }

    const ref = "ZYNG-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: planConfig.amount_kobo,
        currency: "NGN",
        reference: ref,
        callback_url: `${req.protocol}://${req.get("host")}/settings?payment=verify`,
        metadata: {
          plan: planConfig.label,
        },
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return res.status(400).json({ success: false, error: data.message || "Paystack initialization failed" });
    }

    return res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
      public_key: publicKey,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { reference, userId } = req.body;
    if (!reference) {
      return res.status(400).json({ success: false, error: "reference required" });
    }

    const secretKey = getPaystackSecret();
    if (!secretKey) {
      return res.status(200).json({
        success: true,
        test_mode: true,
        message: "Paystack not configured — simulating successful payment.",
      });
    }

    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    const data = await paystackRes.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ success: false, error: data.message || "Payment verification failed" });
    }

    const plan = data.data.metadata?.plan || "Pro";

    if (userId) {
      await adminAuth.updateUserById(userId, {
        user_metadata: {
          tier: plan,
          subscription_status: "active",
          subscription_plan: plan,
          subscription_reference: reference,
          subscription_updated_at: new Date().toISOString(),
        },
      });
    }

    return res.json({
      success: true,
      plan,
      message: `Successfully upgraded to ${plan}!`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/public-key", (_req: Request, res: Response) => {
  const key = getPaystackPublic();
  if (!key) {
    return res.json({ success: false, key: null, message: "Paystack not configured" });
  }
  return res.json({ success: true, key });
});

export default router;
