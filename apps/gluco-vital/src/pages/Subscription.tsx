import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Crown, Calendar, CreditCard, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import StripeCheckout from "@/components/subscription/StripeCheckout";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get("success") === "true";
  const cancelled = urlParams.get("cancelled") === "true";

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: async () => {
      const subs = await appClient.entities.Subscription.filter({ 
        user_email: user.email,
        status: "active"
      });
      return subs?.[0] || null;
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (success) {
      // Refetch subscription after successful payment
      setTimeout(() => refetch(), 2000);
    }
  }, [success, refetch]);

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-[#f8faf9] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to={createPageUrl("Profile")} 
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#5b9a8b] mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Subscription</h1>
          <p className="text-slate-500">Manage your GlucoVital plan</p>
        </div>

        {/* Success/Cancel Messages */}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Payment successful!</p>
                <p className="text-sm text-green-600">Your subscription is now active. Thank you!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {cancelled && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Payment cancelled</p>
                <p className="text-sm text-amber-600">No charges were made. You can try again anytime.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription */}
        {subscription && (
          <Card className="mb-6 border-[#5b9a8b]/30 bg-[#5b9a8b]/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="w-5 h-5 text-amber-500" />
                Current Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {subscription.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CreditCard className="w-4 h-4" />
                  ₹{(subscription.amount / 100).toFixed(0)}/{subscription.billing_cycle}
                </div>
                {subscription.current_period_end && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    Renews: {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {subscription ? "Change Plan" : "Choose Your Plan"}
          </h2>
          <StripeCheckout currentPlan={currentPlan} />
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-slate-800">Can I cancel anytime?</p>
              <p className="text-sm text-slate-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">Is my payment secure?</p>
              <p className="text-sm text-slate-600">Yes, all payments are processed securely through Stripe. We never store your card details.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800">What happens to my data if I downgrade?</p>
              <p className="text-sm text-slate-600">Your data is always safe. On the free plan, you'll have access to the last 7 days of history.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}