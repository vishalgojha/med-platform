import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, RefreshCcw, XCircle, AlertCircle } from "lucide-react";

export default function CancellationRefund() {
  useEffect(() => {
    document.title = "Cancellation & Refund Policy - GlucoVital";
    return () => { document.title = "Gluco Vital"; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#5b9a8b] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#5b9a8b]/10 flex items-center justify-center">
            <RefreshCcw className="w-5 h-5 text-[#5b9a8b]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Cancellation & Refund</h1>
            <p className="text-xs text-slate-500">Last updated: December 2025</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Free Plan */}
          <section className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h2 className="font-semibold text-green-800 text-sm mb-1">✓ Free Plan</h2>
            <p className="text-xs text-green-700">
              Completely free forever. No payment, no cancellation needed.
            </p>
          </section>

          {/* How to Cancel */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-[#5b9a8b]" />
              <h2 className="font-semibold text-slate-800 text-sm">How to Cancel</h2>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>1. Go to Profile → Subscription Settings</li>
              <li>2. Click "Cancel Subscription"</li>
              <li>3. Or email <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] underline">support@glucovital.fit</a></li>
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Your subscription stays active until billing period ends, then reverts to Free plan.
            </p>
          </section>

          {/* No Refunds */}
          <section className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-red-800 text-sm">No Refund Policy</h2>
            </div>
            <p className="text-xs text-red-700">
              All payments are <strong>final and non-refundable</strong>. Digital services are delivered instantly.
            </p>
          </section>

          {/* Recommendation */}
          <section className="bg-[#5b9a8b]/5 rounded-xl p-4 border border-[#5b9a8b]/20">
            <h2 className="font-semibold text-[#5b9a8b] text-sm mb-2">💡 Before Subscribing</h2>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Use the Free plan first</li>
              <li>• Try Demo Mode to explore features</li>
              <li>• Contact us with questions</li>
            </ul>
          </section>

          {/* Exceptions */}
          <section className="bg-white rounded-xl p-4 border border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm mb-2">Rare Exceptions</h2>
            <p className="text-xs text-slate-600">
              We may consider refunds for duplicate charges or unauthorized transactions (with documentation). Approval not guaranteed.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> GlucoVital is a tracking tool, not medical treatment. Refunds won't be granted based on health outcomes.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <p className="text-xs text-slate-600 mb-1">Questions about billing?</p>
            <a href="mailto:support@glucovital.fit" className="text-[#5b9a8b] text-sm hover:underline">
              support@glucovital.fit
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}