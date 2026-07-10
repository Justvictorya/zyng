export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050507] text-slate-200 p-5 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">Z</div>
          <span className="text-sm font-bold text-white">Zyng</span>
        </div>

        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: July 10, 2026</p>

        <p className="text-sm text-slate-300">
          By using Zyng ("the Service"), operated by Victoria John ("we", "us", "our"), you agree to these Terms of Service. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">1. Service Description</h2>
        <p className="text-sm text-slate-300">
          Zyng provides a social media management platform that allows users to schedule, create with AI-assisted captioning, and publish content across multiple social media platforms (including Facebook, Instagram, TikTok, Twitter/X, LinkedIn, YouTube, and WhatsApp) through a unified dashboard.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">2. Eligibility</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You must be at least 13 years old, or the age of digital consent in your country, to use the Service.</li>
          <li>By creating an account, you represent that all information you provide is accurate and complete.</li>
          <li>If you are using the Service on behalf of an entity, you represent that you have authority to bind that entity.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">3. Account Registration & Security</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You must notify us immediately at support@zyngapp.com of any unauthorized use of your account.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">4. Subscriptions & Payments</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Paid plans are billed monthly or annually via Paystack in Nigerian Naira (NGN).</li>
          <li>Subscriptions auto-renew unless canceled at least 24 hours before the next billing cycle.</li>
          <li>Cancellation takes effect at the end of the current billing period; no prorated refunds for partial periods.</li>
          <li>Refunds for billing errors or service issues are handled on a case-by-case basis. Contact support@zyngapp.com.</li>
          <li>We may change pricing with 30 days' notice. Continued use after the change constitutes acceptance.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">5. Third-Party Services & Platforms</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Zyng integrates with third-party social media platforms via their official APIs.</li>
          <li>You must comply with each platform's terms of service and developer policies when posting through Zyng.</li>
          <li>We are not responsible for changes, restrictions, or outages imposed by third-party platforms.</li>
          <li>You grant Zyng permission to access, store, and use your connected account tokens solely for the purpose of providing the Service.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">6. AI Features</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>Zyng uses Google's Gemini AI to generate caption suggestions and content analysis.</li>
          <li>AI-generated content is provided as a suggestion only. You are solely responsible for reviewing and approving all content before publishing.</li>
          <li>We do not claim ownership of AI-generated outputs; ownership remains with you.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">7. Acceptable Use</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You may not use the Service to post illegal, abusive, harassing, defamatory, infringing, or spam content.</li>
          <li>You may not attempt to bypass rate limits, reverse-engineer the Service, scrape data, or disrupt the Service's operation.</li>
          <li>You may not use the Service to violate any applicable law or regulation.</li>
          <li>We reserve the right to remove content and suspend accounts that violate this policy.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">8. Intellectual Property</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>The Zyng name, logo, and brand are our property.</li>
          <li>You retain all ownership of the content you create and post through the Service.</li>
          <li>We do not claim any intellectual property rights over your content.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">9. Data Privacy</h2>
        <p className="text-sm text-slate-300">
          Your use of the Service is governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review it at <a href="/privacy" className="text-indigo-400 underline">zyngapp.com/privacy</a>.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">10. Limitation of Liability</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>The Service is provided "as is" and "as available" without warranties of any kind, express or implied.</li>
          <li>We do not guarantee that the Service will be uninterrupted, secure, or error-free.</li>
          <li>We are not liable for damages arising from your use of the Service, including but not limited to: content not posting, scheduling errors, data loss, downtime, or unauthorized access to your connected accounts.</li>
          <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">11. Indemnification</h2>
        <p className="text-sm text-slate-300">
          You agree to indemnify and hold us harmless from any claims, losses, or expenses arising from your use of the Service, your violation of these Terms, or your content.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">12. Termination</h2>
        <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5">
          <li>You may delete your account at any time via Settings or by emailing support@zyngapp.com.</li>
          <li>We may suspend or terminate your account if you violate these Terms.</li>
          <li>Upon termination, your access to the Service ceases and your data will be deleted per our Privacy Policy.</li>
        </ul>

        <h2 className="text-lg font-semibold text-white pt-4">13. Governing Law</h2>
        <p className="text-sm text-slate-300">
          These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos, Nigeria.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">14. Changes to Terms</h2>
        <p className="text-sm text-slate-300">
          We may update these Terms from time to time. Material changes will be notified via email or in-app notice. Continued use after changes take effect constitutes acceptance of the updated Terms.
        </p>

        <h2 className="text-lg font-semibold text-white pt-4">15. Contact</h2>
        <p className="text-sm text-slate-300">
          For questions, complaints, or legal notices:<br />
          Email: support@zyngapp.com<br />
          Operator: Victoria John<br />
          Jurisdiction: Lagos, Nigeria
        </p>
      </div>
    </div>
  );
}
