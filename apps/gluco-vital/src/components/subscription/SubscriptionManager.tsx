import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, Crown, Users, Zap, Star, CreditCard, Calendar, AlertCircle, Key, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PLANS = {
  basic: {
    name: "Basic",
    price: 0,
    priceYearly: 0,
    features: [
      "Unlimited sugar & BP logging",
      "WhatsApp text logging",
      "7-day history",
      "Basic daily trends",
      "14 languages"
    ],
    limitations: [
      "No AI insights",
      "No reports/exports",
      "No doctor sharing"
    ],
    icon: Zap,
    color: "slate",
    tagline: "Always Free"
  },
  starter: {
    name: "Starter",
    price: 99,
    priceYearly: 999,
    features: [
      "Everything in Basic",
      "30-day history",
      "Weekly AI insights",
      "Basic PDF reports",
      "Medication reminders",
      "Email support"
    ],
    limitations: [
      "No voice reminders",
      "No doctor sharing",
      "No caregiver access"
    ],
    icon: Star,
    color: "blue",
    tagline: "First month FREE"
  },
  premium: {
    name: "Premium",
    price: 499,
    priceYearly: 4999,
    features: [
      "Everything in Starter",
      "Unlimited history",
      "Daily AI coaching (Nurse)",
      "Advanced analytics",
      "Doctor sharing & summaries",
      "Voice reminders (Asha)",
      "Lab report analysis",
      "Priority WhatsApp support"
    ],
    limitations: [],
    icon: Crown,
    color: "amber",
    popular: true,
    tagline: "Most Popular"
  },
  family: {
    name: "Family",
    price: 799,
    priceYearly: 7999,
    features: [
      "Everything in Premium",
      "Up to 5 family members",
      "Caregiver dashboard",
      "Real-time health alerts",
      "Family health insights",
      "Dedicated support line",
      "Emergency escalation"
    ],
    limitations: [],
    icon: Users,
    color: "violet",
    tagline: "Best for Families"
  }
};

// Feature access control - what requires which plan
export const FEATURE_ACCESS = {
  // Basic (Free)
  basic_logging: "basic",
  whatsapp_text: "basic",
  seven_day_history: "basic",
  basic_trends: "basic",
  
  // Starter (₹99)
  thirty_day_history: "starter",
  weekly_ai_insights: "starter",
  basic_reports: "starter",
  medication_reminders: "starter",
  
  // Premium (₹499)
  unlimited_history: "premium",
  daily_ai_coaching: "premium",
  advanced_analytics: "premium",
  doctor_sharing: "premium",
  voice_reminders: "premium",
  lab_analysis: "premium",
  clinical_summaries: "premium",
  
  // Family (₹799)
  family_members: "family",
  caregiver_dashboard: "family",
  realtime_alerts: "family",
  emergency_escalation: "family"
};

// Helper to check if user has access to a feature
export function hasFeatureAccess(userPlan, feature) {
  const requiredPlan = FEATURE_ACCESS[feature];
  if (!requiredPlan) return true; // Feature not restricted
  
  const planHierarchy = ["basic", "starter", "premium", "family"];
  const userPlanIndex = planHierarchy.indexOf(userPlan || "basic");
  const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);
  
  return userPlanIndex >= requiredPlanIndex;
}

export default function SubscriptionManager({ user }) {
  const isAdmin = user?.role === 'admin';
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [processing, setProcessing] = useState(false);
  const [showSecretsInfo, setShowSecretsInfo] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await appClient.entities.Subscription.filter({ user_email: user.email });
      return subs.find(s => s.status === 'active') || subs[0] || null;
    },
    enabled: !!user?.email
  });

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const response = await appClient.functions.invoke('createRazorpaySubscription', {
        plan: selectedPlan,
        billing_cycle: billingCycle
      });

      const { subscription_id, key_id, short_url } = response.data;

      // Open Razorpay checkout or redirect to short_url
      if (short_url) {
        window.open(short_url, '_blank');
        toast.success("Redirecting to payment...");
        setShowUpgradeDialog(false);
      } else if (window.Razorpay && key_id) {
        const options = {
          key: key_id,
          subscription_id: subscription_id,
          name: "GlucoVital",
          description: `${PLANS[selectedPlan].name} Plan - ${billingCycle}`,
          handler: function (response) {
            toast.success("Payment successful! Your subscription is now active.");
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
            setShowUpgradeDialog(false);
          },
          prefill: {
            name: user?.full_name,
            email: user?.email
          },
          theme: {
            color: "#5b9a8b"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to create subscription. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const currentPlan = subscription?.plan || "basic";
  const isActive = subscription?.status === "active";

  return (
    <>
      {/* Current Plan Card */}
      <Card className="border-2 border-slate-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-500" />
              Subscription
            </CardTitle>
            {isActive && (
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {React.createElement(PLANS[currentPlan]?.icon || Zap, {
                  className: `w-8 h-8 ${currentPlan === 'premium' ? 'text-amber-500' : currentPlan === 'family' ? 'text-violet-500' : 'text-slate-500'}`
                })}
                <div>
                  <p className="font-semibold text-lg">{PLANS[currentPlan]?.name || "Basic"} Plan</p>
                  {isActive && subscription?.current_period_end && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {currentPlan === "basic" ? (
                <Button 
                  onClick={() => setShowUpgradeDialog(true)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Try Starter FREE for 1 Month
                </Button>
              ) : currentPlan === "starter" ? (
                <Button 
                  onClick={() => { setSelectedPlan("premium"); setShowUpgradeDialog(true); }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              ) : (
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  You have full access to all features
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Choose Your Plan</DialogTitle>
            <DialogDescription>
              Unlock premium features for better health management
            </DialogDescription>
          </DialogHeader>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-2 bg-slate-50 rounded-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly" ? "bg-white shadow text-slate-800" : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly" ? "bg-white shadow text-slate-800" : "text-slate-500"
              }`}
            >
              Yearly
              <Badge className="bg-green-100 text-green-700 text-xs">Save 15%</Badge>
            </button>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {["starter", "premium", "family"].map(planKey => {
              const plan = PLANS[planKey];
              const price = billingCycle === "yearly" ? plan.priceYearly : plan.price;
              const Icon = plan.icon;
              const isSelected = selectedPlan === planKey;
              
              const colorClasses = {
                starter: { border: 'border-blue-400', bg: 'bg-blue-50', icon: 'bg-blue-100', iconText: 'text-blue-600', check: 'text-blue-500', badge: 'bg-blue-500' },
                premium: { border: 'border-amber-400', bg: 'bg-amber-50', icon: 'bg-amber-100', iconText: 'text-amber-600', check: 'text-amber-500', badge: 'bg-amber-500' },
                family: { border: 'border-violet-400', bg: 'bg-violet-50', icon: 'bg-violet-100', iconText: 'text-violet-600', check: 'text-violet-500', badge: 'bg-violet-500' }
              };
              const colors = colorClasses[planKey];

              return (
                <div
                  key={planKey}
                  onClick={() => setSelectedPlan(planKey)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected ? `${colors.border} ${colors.bg}` : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500">
                      Most Popular
                    </Badge>
                  )}
                  
                  {planKey === 'starter' && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500">
                      First Month FREE
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${colors.icon}`}>
                      <Icon className={`w-5 h-5 ${colors.iconText}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-lg font-bold">
                        ₹{price}
                        <span className="text-sm font-normal text-slate-500">
                          /{billingCycle === "yearly" ? "year" : "mo"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <Check className={`w-3.5 h-3.5 mt-0.5 ${colors.check}`} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-xs text-slate-400 pl-5">+{plan.features.length - 6} more</li>
                    )}
                  </ul>

                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${colors.badge}`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={processing}
            className={`w-full h-12 text-lg ${
              selectedPlan === 'starter'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : selectedPlan === 'premium' 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedPlan === 'starter' ? 'Start Free Trial' : `Subscribe to ${PLANS[selectedPlan].name}`} - ₹{billingCycle === "yearly" ? PLANS[selectedPlan].priceYearly : PLANS[selectedPlan].price}/{billingCycle === "yearly" ? "yr" : "mo"}
              </>
            )}
          </Button>
          
          {selectedPlan === 'starter' && (
            <p className="text-xs text-center text-green-600 font-medium">
              🎉 First month completely FREE, then ₹99/month
            </p>
          )}

          <p className="text-xs text-center text-slate-400">
            Secure payment powered by Razorpay. Cancel anytime.
          </p>
        </DialogContent>
      </Dialog>

      {/* Admin: Secrets Configuration Info - Only show to actual admins */}
      {isAdmin === true && user?.role === 'admin' && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <Key className="w-5 h-5" />
              Razorpay Configuration (Admin Only)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-amber-700">
              The following secrets need to be configured in the appClient dashboard for payments to work:
            </p>
            
            <div className="space-y-2">
              <SecretItem name="RAZORPAY_KEY_ID" description="Your Razorpay API Key ID" />
              <SecretItem name="RAZORPAY_KEY_SECRET" description="Your Razorpay API Key Secret" />
              <SecretItem name="RAZORPAY_WEBHOOK_SECRET" description="Webhook secret for verifying payment events" />
              <SecretItem name="RAZORPAY_PLAN_PREMIUM_MONTHLY" description="Plan ID for Premium Monthly (optional)" />
              <SecretItem name="RAZORPAY_PLAN_PREMIUM_YEARLY" description="Plan ID for Premium Yearly (optional)" />
              <SecretItem name="RAZORPAY_PLAN_FAMILY_MONTHLY" description="Plan ID for Family Monthly (optional)" />
              <SecretItem name="RAZORPAY_PLAN_FAMILY_YEARLY" description="Plan ID for Family Yearly (optional)" />
            </div>

            <Alert className="bg-white border-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                <strong>Setup Steps:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                  <li>Create a Razorpay account at <a href="https://razorpay.com" target="_blank" rel="noopener" className="underline">razorpay.com</a></li>
                  <li>Go to Settings → API Keys to get your Key ID and Secret</li>
                  <li>Create subscription plans in Razorpay Dashboard → Products → Subscriptions</li>
                  <li>Set up webhook at Settings → Webhooks with your function URL</li>
                  <li>Add all secrets in appClient Dashboard → Settings → Environment Variables</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline" 
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => window.open('https://dashboard.razorpay.com', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Razorpay Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SecretItem({ name, description }) {
  return (
    <div className="flex items-start gap-3 p-2 bg-white rounded-lg border border-amber-200">
      <code className="text-xs bg-amber-100 px-2 py-1 rounded font-mono text-amber-800 whitespace-nowrap">
        {name}
      </code>
      <span className="text-xs text-amber-600">{description}</span>
    </div>
  );
}