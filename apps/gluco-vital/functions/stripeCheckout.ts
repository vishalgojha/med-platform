import { createClientFromRequest } from './_shared/server-client';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICES = {
  premium: "price_1Soja3BTrEdd0ixKedmPxRvm",
  family: "price_1Soja3BTrEdd0ixKf8SjaPOk"
};

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    
    // Get user info (optional for public app)
    let user = null;
    try {
      user = await appClient.auth.me();
    } catch (e) {
      // User not logged in
    }

    const { plan, successUrl, cancelUrl } = await req.json();
    
    console.log("Creating checkout session for plan:", plan);

    if (!plan || !PRICES[plan]) {
      console.error("Invalid plan:", plan);
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!successUrl || !cancelUrl) {
      console.error("Missing URLs:", { successUrl, cancelUrl });
      return Response.json({ error: "Missing success or cancel URL" }, { status: 400 });
    }

    const sessionParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICES[plan],
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        APP_app_id: Deno.env.get("APP_APP_ID"),
        plan: plan,
        user_email: user?.email || "anonymous"
      }
    };

    // Pre-fill email if user is logged in
    if (user?.email) {
      sessionParams.customer_email = user.email;
    }

    console.log("Creating Stripe session with params:", JSON.stringify(sessionParams, null, 2));
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    console.log("Checkout session created:", session.id);

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});