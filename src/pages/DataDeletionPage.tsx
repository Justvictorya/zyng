export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-5 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Data Deletion Instructions</h1>
        <p className="text-xs text-slate-400">Last updated: July 10, 2026</p>

        <p className="text-sm text-slate-300">
          In compliance with the Nigeria Data Protection Regulation (NDPR) and applicable privacy laws, you can request deletion of your Zyng account and all associated personal data at any time.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">How to Request Deletion</h2>

        <h3 className="text-md font-semibold text-slate-100 pt-3">Option 1: Email Request</h3>
        <p className="text-sm text-slate-300">
          Send an email to <span className="text-indigo-400">support@zyngapp.com</span> with:
        </p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Subject line: "Data Deletion Request"</li>
          <li>The email address associated with your Zyng account</li>
          <li>Your full name for verification</li>
        </ul>
        <p className="text-sm text-slate-300 pt-2">
          We will verify your identity and process the deletion within 30 days. A confirmation email will be sent once deletion is complete.
        </p>

        <h3 className="text-md font-semibold text-slate-100 pt-3">Option 2: In-App Deletion</h3>
        <p className="text-sm text-slate-300">
          Log in to your Zyng account, navigate to Settings → Account, and click "Delete Account". Follow the prompts to confirm. (This feature will be available in an upcoming update — please use Option 1 for now.)
        </p>

        <h3 className="text-md font-semibold text-slate-100 pt-3">Option 3: For Facebook / Meta Linked Accounts</h3>
        <p className="text-sm text-slate-300">
          If you connected your Zyng account via Facebook or Instagram and wish to delete data associated with that connection, you can also delete your Zyng data through Meta's "Apps and Websites" settings at <span className="text-indigo-400">facebook.com/settings?tab=applications</span>.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">What Gets Deleted</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Your profile and account information (name, email, password hash, profile picture)</li>
          <li>All posts, drafts, captions, and scheduling data</li>
          <li>Uploaded media files and asset references</li>
          <li>Connected social media account OAuth tokens (these are also revoked where platform APIs permit)</li>
          <li>Analytics data, engagement metrics, and performance reports</li>
          <li>Subscription history and billing information</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">What Is Retained</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Anonymized or aggregated analytics that cannot be traced back to you may be retained for service improvement.</li>
          <li>Billing records required by Nigerian tax law are retained for 6 years. These contain minimal data (transaction amount, date, masked payment reference).</li>
          <li>If you have pending posts scheduled on connected platforms, those posts may not be recallable after token revocation.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">Processing Time</h2>
        <p className="text-sm text-slate-300">
          We process deletion requests within 30 days of verified identity confirmation. Most requests are completed within 7 business days. You will receive a confirmation email once the deletion is complete.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">Contact</h2>
        <p className="text-sm text-slate-300">
          For questions about data deletion or privacy: support@zyngapp.com
        </p>
      </div>
    </div>
  );
}
