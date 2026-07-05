export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: June 26, 2026</p>

        <p className="text-sm text-slate-300">
          Zyng ("we", "our", "us") operates zyngapp.com. This page explains how we collect, use, and protect your personal data.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">1. Data We Collect</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Account information: name, email address, profile picture</li>
          <li>Social media account connections and access tokens</li>
          <li>Post content, captions, media URLs you create or upload</li>
          <li>Analytics and engagement data from connected platforms</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">2. How We Use Data</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>To authenticate you and manage your account</li>
          <li>To schedule and publish posts to your connected social platforms</li>
          <li>To provide AI-powered caption generation and content analysis</li>
          <li>To generate analytics and performance reports</li>
          <li>To process subscription payments via Paystack</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">3. Data Sharing</h2>
        <p className="text-sm text-slate-300">
          We never sell your data. We share data only with:
        </p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Supabase (database hosting)</li>
          <li>Paystack (payment processing)</li>
          <li>Social platforms (Facebook, Instagram, TikTok, etc.) when you authorize posting</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">4. Data Retention</h2>
        <p className="text-sm text-slate-300">
          We retain your data for as long as your account is active. You can request deletion at any time.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">5. Your Rights</h2>
        <p className="text-sm text-slate-300">
          You may request access to, correction of, or deletion of your personal data by contacting us at support@zyngapp.com.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">6. Contact</h2>
        <p className="text-sm text-slate-300">
          For privacy inquiries: support@zyngapp.com
        </p>
      </div>
    </div>
  );
}
