import React, { useEffect } from "react";
import { FileText, AlertTriangle, UserCheck, Ban, Scale, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service - GlucoVital";
    return () => { document.title = "Gluco Vital"; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#5b9a8b] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Terms of Service</h1>
        <p className="text-xs text-slate-500 mb-6">Last updated: December 2025</p>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 bg-white rounded-xl p-4 border border-slate-100">
            By using GlucoVital.fit, you agree to these terms. Please read carefully.
          </p>

          {/* Medical Disclaimer */}
          <section className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-amber-800 text-sm">Medical Disclaimer</h2>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>GlucoVital is NOT a medical device.</strong> It does not diagnose, treat, or cure any disease. 
              Always consult a qualified healthcare provider for medical decisions. In emergencies, call local emergency services.
            </p>
          </section>

          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-slate-800 text-sm">What We Provide</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Health data logging and tracking</li>
              <li>• AI-generated insights (not medical advice)</li>
              <li>• Medication reminders</li>
              <li>• Reports to share with doctors</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Your Responsibilities</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Provide accurate information</li>
              <li>• Keep credentials secure</li>
              <li>• Use for personal purposes only</li>
              <li>• Consult doctors for health decisions</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Prohibited Uses</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Illegal activities</li>
              <li>• Accessing others' data</li>
              <li>• Reverse engineering</li>
              <li>• Providing medical advice to others</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Limitations</h2>
            </div>
            <p className="text-xs text-slate-600">
              Service provided "as is" without warranties. We're not liable for indirect damages from use of the service.
            </p>
          </section>

          <section className="bg-[#5b9a8b]/5 rounded-xl p-4 border border-[#5b9a8b]/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-[#5b9a8b]" />
              <h2 className="font-semibold text-slate-800 text-sm">Questions?</h2>
            </div>
            <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] text-sm hover:underline">
              support@glucovital.fit
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}