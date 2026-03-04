import { createClientFromRequest } from './_shared/server-client';

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

// Plan IDs - you'll need to create these in Razorpay Dashboard
const PLAN_IDS = {
  premium_monthly_inr: Deno.env.get("RAZORPAY_PLAN_PREMIUM_MONTHLY") || "plan_premium_monthly",
  premium_yearly_inr: Deno.env.get("RAZORPAY_PLAN_PREMIUM_YEARLY") || "plan_premium_yearly",
  family_monthly_inr: Deno.env.get("RAZORPAY_PLAN_FAMILY_MONTHLY") || "plan_family_monthly",
  family_yearly_inr: Deno.env.get("RAZORPAY_PLAN_FAMILY_YEARLY") || "plan_family_yearly"
};

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billing_cycle = "monthly" } = await req.json();

    if (!plan || !["premium", "family"].includes(plan)) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planId = PLAN_IDS[`${plan}_${billing_cycle}_inr`];
    if (!planId) {
      return Response.json({ error: "Plan not configured" }, { status: 400 });
    }

    // Create Razorpay subscription
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 12, // 12 billing cycles
        quantity: 1,
        customer_notify: 1,
        notes: {
          email: user.email,
          plan: plan,
          user_name: user.full_name
        }
      })
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json();
      console.error("Razorpay error:", error);
      return Response.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const subscription = await subscriptionResponse.json();

    // Create pending subscription record
    await appClient.entities.Subscription.create({
      user_email: user.email,
      plan: plan,
      status: "pending",
      razorpay_subscription_id: subscription.id,
      billing_cycle: billing_cycle
    });

    return Response.json({
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      key_id: RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});