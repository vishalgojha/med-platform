import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Loader2, Crown, ExternalLink, Star, X } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Basic",
    price: "₹0",
    period: "forever",
    description: "Always free",
    features: [
      "Unlimited sugar & BP logging",
      "WhatsApp text logging",
      "7-day history",
      "Basic trends",
      "14 languages"
    ],
    notIncluded: ["AI insights", "Reports", "Doctor sharing"],
    color: "bg-slate-100",
    popular: false
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹99",
    period: "/month",
    description: "First month FREE",
    features: [
      "Everything in Basic",
      "30-day history",
      "Weekly AI insights",
      "Basic PDF reports",
      "Medication reminders"
    ],
    notIncluded: ["Voice reminders", "Doctor sharing"],
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    popular: false,
    freeTrial: true
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹499",
    period: "/month",
    description: "Most popular",
    features: [
      "Everything in Starter",
      "Unlimited history",
      "Daily AI coaching",
      "Doctor sharing & summaries",
      "Voice reminders (Asha)",
      "Lab report analysis"
    ],
    notIncluded: [],
    color: "bg-gradient-to-br from-[#5b9a8b] to-[#7eb8a8]",
    popular: true
  },
  {
    id: "family",
    name: "Family",
    price: "₹799",
    period: "/month",
    description: "For caregivers",
    features: [
      "Everything in Premium",
      "Up to 5 family members",
      "Caregiver dashboard",
      "Real-time alerts",
      "Emergency escalation"
    ],
    notIncluded: [],
    color: "bg-gradient-to-br from-violet-500 to-purple-600",
    popular: false
  }
];

export default function StripeCheckout({ currentPlan = "free", onSuccess }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckout = async (planId) => {
    // Check if in iframe
    if (window.self !== window.top) {
      alert("Please open the app in a new tab to complete checkout. Payments cannot be processed in preview mode.");
      return;
    }

    if (planId === "free") return;

    setLoading(planId);
    setError(null);

    try {
      const currentUrl = window.location.origin;
      const response = await appClient.functions.invoke("stripeCheckout", {
        plan: planId,
        successUrl: `${currentUrl}/Subscription?success=true`,
        cancelUrl: `${currentUrl}/Subscription?cancelled=true`
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to start checkout. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-3">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden transition-all ${
              plan.popular ? "border-2 border-[#5b9a8b] shadow-lg md:scale-105" : "border border-slate-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#5b9a8b] text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                Most Popular
              </div>
            )}
            {plan.freeTrial && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                1st Month FREE
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-2">
                {plan.id === "free" && <Sparkles className="w-5 h-5 text-slate-400" />}
                {plan.id === "starter" && <Star className="w-5 h-5 text-blue-500" />}
                {plan.id === "premium" && <Crown className="w-5 h-5 text-amber-500" />}
                {plan.id === "family" && <Users className="w-5 h-5 text-violet-500" />}
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-slate-500 text-xs">{plan.period}</span>
              </div>
              <CardDescription className="text-xs">{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {plan.notIncluded && plan.notIncluded.length > 0 && (
                <ul className="space-y-1 pt-2 border-t border-slate-100">
                  {plan.notIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <X className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.id === "free" ? (
                <Button 
                  variant="outline" 
                  className="w-full text-sm h-9"
                  disabled={currentPlan === "free"}
                >
                  {currentPlan === "free" ? "Current Plan" : "Downgrade"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id || currentPlan === plan.id}
                  className={`w-full text-sm h-9 ${
                    plan.id === "starter" ? "bg-blue-500 hover:bg-blue-600" :
                    plan.popular ? "bg-[#5b9a8b] hover:bg-[#4a8a7b]" : 
                    plan.id === "family" ? "bg-violet-500 hover:bg-violet-600" : ""
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : currentPlan === plan.id ? (
                    "Current Plan"
                  ) : plan.freeTrial ? (
                    "Start Free Trial"
                  ) : (
                    <>
                      Upgrade <ExternalLink className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Secure payment powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
}