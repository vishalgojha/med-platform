import React, { useEffect } from "react";
import { Heart, MessageCircle, Globe, Shield, Users, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function About() {
  useEffect(() => {
    document.title = "About GlucoVital - AI Diabetes Management";
    return () => { document.title = "Gluco Vital"; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#5b9a8b] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <Link to={createPageUrl("Landing")} className="flex flex-col items-center mb-6 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 rounded-xl bg-[#5b9a8b] flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">About GlucoVital</h1>
          <p className="text-slate-500 text-sm mt-1">Your AI-powered diabetes companion</p>
        </Link>

        <div className="space-y-4">
          {/* Mission */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-[#5b9a8b]" />
              <h2 className="font-semibold text-slate-800">Our Mission</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Help people with diabetes track, understand, and improve their health through simple WhatsApp logging and smart insights.
            </p>
          </section>

          {/* What We Offer */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-800">What We Offer</h2>
            </div>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>✓ Easy WhatsApp logging — just text your readings</li>
              <li>✓ AI-powered pattern insights</li>
              <li>✓ Smart medication reminders</li>
              <li>✓ Doctor-ready reports</li>
              <li>✓ Streaks and badges to stay motivated</li>
            </ul>
          </section>

          {/* Global */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-slate-800">21 Languages</h2>
            </div>
            <p className="text-sm text-slate-600">
              Hindi, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Bengali, Chinese, Spanish, Arabic, and more.
            </p>
          </section>

          {/* Security */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-slate-800">Your Data, Protected</h2>
            </div>
            <p className="text-sm text-slate-600">
              Encrypted, secure, and never shared. You control your health data.
            </p>
          </section>

          {/* Made in India */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-slate-800">Made in India 🇮🇳</h2>
            </div>
            <p className="text-sm text-slate-600">
              Built for 77M+ Indians with diabetes. We understand your challenges.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-[#5b9a8b]/5 rounded-xl p-4 border border-[#5b9a8b]/20 text-center">
            <p className="text-sm text-slate-600 mb-2">Questions? Reach out:</p>
            <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] font-medium text-sm hover:underline">
              support@glucovital.fit
            </a>
          </section>

          {/* Supported By */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 mb-2">Supported by</p>
            <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer">
              <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs Grants" className="h-5 mx-auto opacity-60 hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}