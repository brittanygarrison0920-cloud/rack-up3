import React from "react";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-slate-950" style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-900 to-purple-300 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
        </div>

        <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-8">
          <p>Effective Date: August 6, 2026</p>
          <p>Last Updated: August 6, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Welcome to Rack Up a Style & Closet Organizer ("we," "our," or "us"). We respect your privacy and are committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              We collect information to provide, maintain, and improve our closet management and outfit recommendation services.
            </p>
            <ul className="space-y-3">
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Personal Information:</strong> Name, email address, profile picture, or account credentials provided during sign-up.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>User Content & Wardrobe Data:</strong> Photos of your clothing items, tags, descriptions, outfit combinations, style preferences, and calendar logs.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Usage Data & Device Information:</strong> IP address, device ID, operating system version, app interaction metrics, and crash logs collected automatically.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Camera & Photo Library Access:</strong> We request access to your device's camera and photo library strictly to allow you to upload wardrobe items and take outfit photos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">We use your data for the following purposes:</p>
            <ul className="space-y-3">
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed">To organize and display your wardrobe, log outfits, and generate personalized style recommendations.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed">To process artificial intelligence features (e.g., background removal or automated clothing tagging).</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed">To sync your closet data across devices tied to your account.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed">To communicate app updates, technical support responses, and promotional notices (if opted in).</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed">To analyze user activity and improve app stability and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Data Sharing and Third-Party Services</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">We do not sell your personal data. We may share information only in the following scenarios:</p>
            <ul className="space-y-3">
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Service Providers:</strong> Cloud storage providers (e.g., AWS, Firebase), AI API providers, and analytics vendors under strict confidentiality obligations.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Legal Compliance:</strong> If required by law, subpoena, or valid court order.</li>
              <li className="text-slate-700 dark:text-slate-300 leading-relaxed"><strong>Business Transfers:</strong> In connection with a merger, sale of assets, or acquisition.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Data Retention & Deletion Rights</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We retain your wardrobe data and personal account information for as long as your account is active. You may request account deletion and the purging of your uploaded images and style data at any time through the app settings or by contacting us at contentcraftaiapp@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Data Security</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              We implement industry-standard administrative, physical, and technical security measures to protect your wardrobe uploads and personal data. However, no transmission over the internet is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Children's Privacy</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Our application is not intended for children under the age of 13 (or 16 in certain regions). We do not knowingly collect personal data from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Contact Us</h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:contentcraftaiapp@gmail.com" className="text-purple-600 hover:underline font-medium">contentcraftaiapp@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}