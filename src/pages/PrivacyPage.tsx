export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: July 10, 2026</p>

        <p className="text-sm text-slate-300">
          Zyng ("we", "our", "us"), operated by Victoria John, provides the Zyng social media management platform at zyngapp.com. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our Service.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">1. Data Controller</h2>
        <p className="text-sm text-slate-300">
          Victoria John is the data controller for the purposes of the Nigeria Data Protection Regulation (NDPR) and applicable data protection laws. Contact: support@zyngapp.com.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">2. Data We Collect</h2>
        <h3 className="text-md font-semibold text-slate-100 pt-3">2.1 Information You Provide</h3>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Account information: name, email address, profile picture, and password.</li>
          <li>Post content, captions, media files, and scheduling preferences you create or upload.</li>
          <li>Payment information: processed by Paystack; we do not store full card details.</li>
          <li>Communications: emails or messages you send to our support team.</li>
        </ul>

        <h3 className="text-md font-semibold text-slate-100 pt-3">2.2 Information from Connected Platforms</h3>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>OAuth access tokens and refresh tokens for connected social media accounts.</li>
          <li>Social media profile information: page IDs, account names, profile pictures, follower counts.</li>
          <li>Engagement data: likes, comments, shares, impressions, and reach for your posts.</li>
          <li>Media and content from your connected platforms that you choose to manage through Zyng.</li>
        </ul>

        <h3 className="text-md font-semibold text-slate-100 pt-3">2.3 Automatically Collected Data</h3>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Usage data: pages visited, features used, time spent on the Service.</li>
          <li>Device and browser information: IP address, browser type, operating system.</li>
          <li>Cookies and similar tracking technologies (see Section 7).</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">3. How We Use Your Data</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>To create and manage your account and authenticate your identity.</li>
          <li>To schedule, compose, and publish posts to your connected social media platforms.</li>
          <li>To provide AI-powered caption generation and content analysis via Google's Gemini API.</li>
          <li>To generate analytics dashboards and performance reports for your accounts.</li>
          <li>To process subscription payments and manage billing via Paystack.</li>
          <li>To communicate with you about account updates, billing, and service changes.</li>
          <li>To improve the Service, fix bugs, and monitor usage patterns.</li>
          <li>To comply with legal obligations and enforce our Terms of Service.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">4. Legal Basis for Processing (GDPR / NDPR)</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li><strong>Contract:</strong> Processing necessary to provide the Service under our Terms of Service.</li>
          <li><strong>Consent:</strong> Connecting social media accounts, AI features, and marketing emails.</li>
          <li><strong>Legitimate interests:</strong> Improving the Service, security monitoring, and fraud prevention.</li>
          <li><strong>Legal obligation:</strong> Compliance with applicable laws and regulatory requirements.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">5. Data Sharing & Third Parties</h2>
        <p className="text-sm text-slate-300">
          We never sell your personal data. We share data only with service providers essential to operating the Service:
        </p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li><strong>Supabase:</strong> Database hosting and authentication (US-based, SOC 2 compliant).</li>
          <li><strong>Paystack:</strong> Payment processing for subscriptions (Nigeria-based, PCI-DSS compliant).</li>
          <li><strong>Google (Gemini AI):</strong> AI-powered caption generation (content sent for processing; not used for training).</li>
          <li><strong>Social media platforms:</strong> Meta (Facebook/Instagram/WhatsApp), TikTok, Twitter/X, LinkedIn, Google/YouTube — access tokens and content are shared with these platforms only when you authorize posting.</li>
          <li><strong>Render:</strong> Cloud hosting for the application.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">6. Data Retention</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>We retain your data for as long as your account is active.</li>
          <li>After account deletion, we delete or anonymize your data within 30 days, except where legal obligations require retention (e.g., billing records retained for 6 years per Nigerian law).</li>
          <li>OAuth tokens are revoked and deleted upon account deletion or platform disconnection.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">7. Cookies</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>We use essential cookies for authentication and session management.</li>
          <li>We use analytics cookies to understand usage patterns and improve the Service.</li>
          <li>You can control cookies through your browser settings. Disabling essential cookies may affect Service functionality.</li>
          <li>We do not use third-party tracking cookies for advertising.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">8. Data Security</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>All data transmitted between your browser and our servers is encrypted using TLS/SSL.</li>
          <li>OAuth tokens and API keys are encrypted at rest in our database.</li>
          <li>Passwords are hashed using bcrypt via Supabase Auth.</li>
          <li>We conduct regular security reviews and follow industry best practices.</li>
          <li>Despite these measures, no online service is 100% secure. We cannot guarantee absolute security.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">9. Your Rights</h2>
        <p className="text-sm text-slate-300">
          Under the Nigeria Data Protection Regulation (NDPR) and applicable laws, you have the following rights:
        </p>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li><strong>Right of access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Right to rectification:</strong> Request correction of inaccurate or incomplete data.</li>
          <li><strong>Right to erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
          <li><strong>Right to restrict processing:</strong> Request limitation of how we use your data.</li>
          <li><strong>Right to data portability:</strong> Request a machine-readable copy of your data.</li>
          <li><strong>Right to object:</strong> Object to processing based on legitimate interests, including marketing.</li>
          <li><strong>Right to withdraw consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
        </ul>
        <p className="text-sm text-slate-300 pt-2">
          To exercise these rights, email support@zyngapp.com. We will respond within 30 days.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">10. International Data Transfers</h2>
        <p className="text-sm text-slate-300">
          Your data is processed on servers in the United States (Render, Supabase). By using the Service, you consent to such transfers. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where applicable.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">11. Children's Privacy</h2>
        <p className="text-sm text-slate-300">
          The Service is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us at support@zyngapp.com and we will delete it.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">12. Changes to This Policy</h2>
        <p className="text-sm text-slate-300">
          We may update this Privacy Policy from time to time. Material changes will be notified via email or an in-app notice. The "Last updated" date at the top of this page reflects the latest revision.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">13. Contact & Complaints</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Email: support@zyngapp.com</li>
          <li>Operator: Victoria John, Lagos, Nigeria</li>
          <li>If you are unsatisfied with our response, you may lodge a complaint with the Nigeria Data Protection Commission (NDPC).</li>
        </ul>
      </div>
    </div>
  );
}
