import React from "react";
import { FileText } from "lucide-react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-900 to-purple-300 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Terms of Use</h1>
        </div>

        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
          <p>Effective Date: August 6, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              By downloading, accessing, or using Rack Up a Style & Closet Organizer ("App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Account Registration</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. User-Generated Content & Image Uploads</h2>
            <ul className="space-y-3">
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Ownership:</strong> You retain all ownership rights to the clothing photos, outfit images, and closet data you upload to the App.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>License Grant:</strong> By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to host, display, process, and format your photos strictly to provide you with the App's closet management and style analysis features.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Acceptable Use:</strong> You agree not to upload any content that is illegal, offensive, explicit, infringes on third-party copyright/trademarks, or violates any individual's privacy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Subscriptions & In-App Purchases</h2>
            <ul className="space-y-3">
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Billing:</strong> Certain features (e.g., unlimited closet uploads, advanced AI styling) may require a paid subscription. Payments are billed through your Apple App Store or Google Play Store account.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Renewal & Cancellation:</strong> Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing cycle via your device store settings. Refunds are subject to the policies of the relevant app platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Intellectual Property Rights</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The App interface, branding, code, logos, and features are the exclusive property of rack up and are protected by applicable copyright, trademark, and intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Disclaimer of Warranties</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              The App is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, express or implied. We do not guarantee that style recommendations, outfit planning tools, or image background removal will always be error-free or uninterrupted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Limitation of Liability</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              To the maximum extent permitted by law, rack up shall not be liable for any indirect, incidental, consequential, or special damages arising from your use of or inability to use the App, including loss of data or uploaded photos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Termination</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We reserve the right to suspend or terminate your access to the App at our sole discretion, without notice, if you breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">9. Governing Law</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of Ok/USA without regard to its conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">10. Contact Us</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              For support or questions regarding these Terms, contact us at:{" "}
              <a href="mailto:contentcraftaiapp@gmail.com" className="text-purple-600 hover:underline font-medium">contentcraftaiapp@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}