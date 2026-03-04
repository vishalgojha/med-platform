import React, { useEffect } from "react";
import { Shield, Database, Eye, Lock, UserCheck, Mail, ArrowLeft, Clock, FileText, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - GlucoVital";
    return () => { document.title = "Gluco Vital"; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#5b9a8b] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-2">Last updated: January 2026</p>
        <p className="text-xs text-[#5b9a8b] font-medium mb-6">Compliant with Digital Personal Data Protection Act (DPDP Act), 2023</p>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 bg-white rounded-xl p-4 border border-slate-100">
            At GlucoVital.fit ("we", "us", "our"), operated by Chaos Craft Labs LLP, we are committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act). This policy explains how we collect, process, store, and protect your information.
          </p>

          {/* Purpose of Data Collection */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Purpose of Data Collection</h2>
            </div>
            <p className="text-xs text-slate-600 mb-2">We collect your data for the following specific purposes:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• To provide diabetes and health management services</li>
              <li>• To send medication and glucose check reminders</li>
              <li>• To generate personalized health insights and reports</li>
              <li>• To share data with your doctor (only with your consent)</li>
              <li>• To improve our AI-powered health recommendations</li>
            </ul>
          </section>

          {/* What We Collect */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-sm">What Personal Data We Collect</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>Account info:</strong> name, email, phone number</li>
              <li>• <strong>Health data:</strong> blood sugar readings, blood pressure, meals, medications, symptoms</li>
              <li>• <strong>Profile data:</strong> age, gender, health conditions, language preference</li>
              <li>• <strong>Communication data:</strong> WhatsApp messages sent to our health assistant</li>
              <li>• <strong>Lab reports:</strong> uploaded prescriptions and test results</li>
            </ul>
          </section>

          {/* Legal Basis & Consent */}
          <section className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Consent & Legal Basis (DPDP Act)</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• We process your data based on your <strong>explicit consent</strong></li>
              <li>• You provide consent when you create an account and opt-in to services</li>
              <li>• You can <strong>withdraw consent at any time</strong> through Profile → My Data</li>
              <li>• Health data is classified as <strong>Sensitive Personal Data</strong> under DPDP Act</li>
              <li>• We obtain separate consent before sharing data with doctors or caregivers</li>
            </ul>
          </section>

          {/* How We Use It */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-slate-800 text-sm">How We Process Your Data</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Provide personalized health insights and recommendations</li>
              <li>• Send medication and glucose check reminders via WhatsApp</li>
              <li>• Generate weekly/monthly health reports</li>
              <li>• Power our AI health assistant for conversational logging</li>
              <li>• Enable doctor-patient data sharing (with your consent)</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Data Retention Period</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>Health logs:</strong> Retained for 7 years (medical records standard)</li>
              <li>• <strong>Account data:</strong> Retained until you delete your account</li>
              <li>• <strong>WhatsApp messages:</strong> Processed and deleted within 30 days</li>
              <li>• <strong>After account deletion:</strong> All data permanently erased within 90 days</li>
              <li>• <strong>Anonymized data:</strong> May be retained for research/improvement</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-800 text-sm">How We Protect Your Data</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>Encryption:</strong> All data encrypted in transit (TLS) and at rest (AES-256)</li>
              <li>• <strong>Access control:</strong> Only you can access your health data</li>
              <li>• <strong>No sale of data:</strong> We never sell your personal data to third parties</li>
              <li>• <strong>Secure hosting:</strong> Data stored on SOC2-compliant cloud infrastructure</li>
              <li>• <strong>Regular audits:</strong> Security practices reviewed periodically</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Who Can Access Your Data</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>You:</strong> Full access to view, export, and delete</li>
              <li>• <strong>Your doctor:</strong> Only if you explicitly share with them</li>
              <li>• <strong>Caregivers:</strong> Only if you grant them access</li>
              <li>• <strong>Our team:</strong> Limited access for technical support only</li>
              <li>• <strong>Third parties:</strong> Never shared without your consent (except legal requirements)</li>
            </ul>
          </section>

          {/* Your Rights under DPDP */}
          <section className="bg-[#5b9a8b]/10 rounded-xl p-4 border border-[#5b9a8b]/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#5b9a8b]" />
              <h2 className="font-semibold text-slate-800 text-sm">Your Rights (DPDP Act)</h2>
            </div>
            <p className="text-xs text-slate-600 mb-2">Under the DPDP Act 2023, you have the following rights:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• <strong>Right to Access:</strong> View all your personal data we hold</li>
              <li>• <strong>Right to Correction:</strong> Request correction of inaccurate data</li>
              <li>• <strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li>• <strong>Right to Data Portability:</strong> Download your data in a portable format</li>
              <li>• <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              <li>• <strong>Right to Grievance Redressal:</strong> File complaints with our Grievance Officer</li>
            </ul>
            <p className="text-xs text-[#5b9a8b] mt-3 font-medium">
              Exercise these rights in Profile → My Data section
            </p>
          </section>

          {/* Data Deletion */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Account & Data Deletion</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• You can delete your account anytime from Profile → My Data</li>
              <li>• All personal data will be permanently erased within 90 days</li>
              <li>• Deletion is irreversible - please download your data first if needed</li>
              <li>• Some anonymized data may be retained for service improvement</li>
            </ul>
          </section>

          {/* Grievance Officer */}
          <section className="bg-violet-50 rounded-xl p-4 border border-violet-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Grievance Officer (DPDP Act Requirement)</h2>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              For any privacy concerns, data requests, or complaints, contact our Grievance Officer:
            </p>
            <div className="text-xs text-slate-700 space-y-1">
              <p><strong>Name:</strong> Data Protection Officer, GlucoVital</p>
              <p><strong>Email:</strong> <a href="mailto:support@glucovital.fit" className="text-violet-600 hover:underline">support@glucovital.fit</a></p>
              <p><strong>Response time:</strong> Within 72 hours</p>
              <p><strong>Resolution time:</strong> Within 30 days</p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-[#5b9a8b]/5 rounded-xl p-4 border border-[#5b9a8b]/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-[#5b9a8b]" />
              <h2 className="font-semibold text-slate-800 text-sm">Contact Us</h2>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              For any questions about this privacy policy or your data:
            </p>
            <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] text-sm hover:underline">
              support@glucovital.fit
            </a>
            <p className="text-xs text-slate-500 mt-2">
              Chaos Craft Labs LLP, India
            </p>
          </section>

          {/* Updates to Policy */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm mb-2">Changes to This Policy</h2>
            <p className="text-xs text-slate-600">
              We may update this policy to reflect changes in law or our practices. We will notify you of significant changes via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}