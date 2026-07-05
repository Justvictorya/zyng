export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Data Deletion</h1>
        <p className="text-xs text-slate-400">Last updated: June 26, 2026</p>

        <p className="text-sm text-slate-300">
          You can request deletion of your Zyng account and all associated data at any time.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">How to Request Deletion</h2>

        <h3 className="text-md font-semibold text-slate-100 pt-3">Option 1: In-App</h3>
        <p className="text-sm text-slate-300">
          Log in to your account, go to Settings, and click "Delete Account" (coming soon).
        </p>

        <h3 className="text-md font-semibold text-slate-100 pt-3">Option 2: Email</h3>
        <p className="text-sm text-slate-300">
          Send an email to <span className="text-indigo-400">support@zyngapp.com</span> with the subject "Data Deletion Request" from the email address associated with your Zyng account.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">What Gets Deleted</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Your profile and account information</li>
          <li>All posts, captions, and media references</li>
          <li>Connected social media account tokens</li>
          <li>Analytics data and usage history</li>
          <li>Subscription and billing information</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">Processing Time</h2>
        <p className="text-sm text-slate-300">
          We will process your deletion request within 30 days. You will receive a confirmation email once the deletion is complete.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">Contact</h2>
        <p className="text-sm text-slate-300">
          For questions: support@zyngapp.com
        </p>
      </div>
    </div>
  );
}
