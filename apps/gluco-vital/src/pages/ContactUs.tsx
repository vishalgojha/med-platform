import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Mail, Clock, MapPin } from "lucide-react";

export default function ContactUs() {
  useEffect(() => {
    document.title = "Contact Us - GlucoVital";
    return () => { document.title = "Gluco Vital"; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#5b9a8b] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-1">Contact Us</h1>
        <p className="text-sm text-slate-500 mb-6">We're here to help</p>

        <div className="space-y-4">
          {/* Email */}
          <section className="bg-[#5b9a8b]/5 rounded-xl p-4 border border-[#5b9a8b]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5b9a8b] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Email Support</h2>
                <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] text-sm hover:underline">
                  support@glucovital.fit
                </a>
              </div>
            </div>
          </section>

          {/* Response Time */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Response Time</h2>
                <p className="text-xs text-slate-600">24-48 hours (Mon-Fri)</p>
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Business Address</h2>
                <p className="text-xs text-slate-600">Chaos Craft Labs LLP, India 🇮🇳</p>
              </div>
            </div>
          </section>

          {/* What to Include */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm mb-2">When contacting us, include:</h2>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Your registered email</li>
              <li>• Clear description of your issue</li>
              <li>• Screenshots if relevant</li>
            </ul>
          </section>

          {/* Quick Links */}
          <section className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 mb-2">Helpful links:</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link to={createPageUrl("About")} className="text-[#5b9a8b] hover:underline">About</Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="text-[#5b9a8b] hover:underline">Privacy</Link>
              <Link to={createPageUrl("Terms")} className="text-[#5b9a8b] hover:underline">Terms</Link>
              <Link to={createPageUrl("CancellationRefund")} className="text-[#5b9a8b] hover:underline">Refunds</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}