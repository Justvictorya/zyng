import { Resend } from "resend";
import { serviceDb } from "./supabase";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM_EMAIL = "Zyng <notifications@zyngapp.com>";

interface NotificationPrefs {
  email_on_publish: boolean;
  email_on_failure: boolean;
  email_address: string;
}

async function getNotificationPrefs(userId: string): Promise<NotificationPrefs | null> {
  try {
    const { data } = await serviceDb
      .from("users")
      .select("email, notification_prefs")
      .eq("id", userId)
      .single();
    if (!data) return null;
    const prefs = data.notification_prefs;
    if (prefs && typeof prefs === "object") {
      return { ...prefs, email_address: prefs.email_address || data.email } as NotificationPrefs;
    }
    return { email_on_publish: true, email_on_failure: true, email_address: data.email };
  } catch {
    return null;
  }
}

export async function notifyPostPublished(
  userId: string,
  postCaption: string,
  platforms: string[],
  results: { platform: string; success: boolean; error?: string }[]
) {
  if (!resend) return;
  const prefs = await getNotificationPrefs(userId);
  if (!prefs || !prefs.email_on_publish) return;

  const succeeded = results.filter((r) => r.success).map((r) => r.platform);
  const failed = results.filter((r) => !r.success);

  if (succeeded.length === 0) return;

  const subject = `Your post was published to ${succeeded.join(", ")}`;
  const preview = postCaption.length > 100 ? postCaption.substring(0, 100) + "..." : postCaption;

  let failedSection = "";
  if (failed.length > 0) {
    failedSection = `
      <div style="margin-top:16px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
        <p style="color:#991b1b;font-size:13px;font-weight:600;margin:0 0 8px 0;">Failed Platforms</p>
        ${failed.map((f) => `<p style="color:#7f1d1d;font-size:12px;margin:2px 0;">${f.platform}: ${f.error || "Unknown error"}</p>`).join("")}
      </div>`;
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:12px;padding:12px;">
          <span style="color:white;font-size:20px;font-weight:bold;">Z</span>
        </div>
      </div>
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px 0;">Post Published Successfully</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px 0;">Your content is now live on ${succeeded.join(", ")}.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="color:#475569;font-size:12px;margin:0;">${preview}</p>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        ${succeeded.map((p) => `<span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;padding:4px 8px;border-radius:4px;font-weight:600;">${p}</span>`).join("")}
      </div>
      ${failedSection}
      <p style="color:#94a3b8;font-size:11px;margin-top:24px;text-align:center;">
        Manage notifications in <a href="https://zyngapp.com/settings" style="color:#6366f1;">Settings</a>
      </p>
    </div>`;

  try {
    await resend.emails.send({ from: FROM_EMAIL, to: prefs.email_address, subject, html });
  } catch (e: any) {
    console.error("[Notifications] Failed to send publish email:", e.message);
  }
}

export async function notifyPostFailed(
  userId: string,
  postCaption: string,
  platforms: string[],
  results: { platform: string; success: boolean; error?: string }[]
) {
  if (!resend) return;
  const prefs = await getNotificationPrefs(userId);
  if (!prefs || !prefs.email_on_failure) return;

  const failed = results.filter((r) => !r.success);
  if (failed.length === 0) return;

  const subject = `Your post failed to publish`;
  const preview = postCaption.length > 100 ? postCaption.substring(0, 100) + "..." : postCaption;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:12px;padding:12px;">
          <span style="color:white;font-size:20px;font-weight:bold;">Z</span>
        </div>
      </div>
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 8px 0;">Post Publishing Failed</h2>
      <p style="color:#64748b;font-size:13px;margin:0 0 16px 0;">Your post could not be published to the following platforms.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;">
        <p style="color:#475569;font-size:12px;margin:0;">${preview}</p>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:16px;">
        ${failed.map((f) => `<p style="color:#7f1d1d;font-size:12px;margin:4px 0;"><strong>${f.platform}:</strong> ${f.error || "Unknown error"}</p>`).join("")}
      </div>
      <p style="color:#64748b;font-size:12px;margin:0 0 16px 0;">Check your post in the dashboard and try publishing again.</p>
      <p style="color:#94a3b8;font-size:11px;margin-top:24px;text-align:center;">
        Manage notifications in <a href="https://zyngapp.com/settings" style="color:#6366f1;">Settings</a>
      </p>
    </div>`;

  try {
    await resend.emails.send({ from: FROM_EMAIL, to: prefs.email_address, subject, html });
  } catch (e: any) {
    console.error("[Notifications] Failed to send failure email:", e.message);
  }
}
