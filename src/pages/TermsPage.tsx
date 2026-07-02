export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: July 2, 2026</p>

        <p className="text-sm text-slate-300">
          By using Zyng ("the Service"), operated by Victoria John, you agree to these terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">1. Service Description</h2>
        <p className="text-sm text-slate-300">
          Zyng provides a social media management platform that allows users to schedule, create, and post content across multiple social media platforms through a unified dashboard.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">2. Account Registration</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You must provide accurate and complete information when creating an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You must be at least 13 years old to use the Service.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">3. Subscriptions & Payments</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Paid plans are billed monthly via Paystack in Nigerian Naira (NGN).</li>
          <li>Subscriptions auto-renew unless canceled before the next billing cycle.</li>
          <li>Refunds are handled on a case-by-case basis. Contact support@zyngapp.com for issues.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">4. Acceptable Use</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You may not use the Service to post illegal, abusive, or spam content.</li>
          <li>You may not attempt to bypass rate limits, scrape data, or disrupt the Service.</li>
          <li>You must comply with each social platform's terms of service when posting through Zyng.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">5. Limitation of Liability</h2>
        <p className="text-sm text-slate-300">
          Zyng is provided "as is" without warranties. We are not liable for damages arising from your use of the Service, including but not limited to content not posting, scheduling errors, or downtime.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">6. Contact</h2>
        <p className="text-sm text-slate-300">
          For questions or concerns: support@zyngapp.com
        </p>
      </div>
    </div>
  );
}
