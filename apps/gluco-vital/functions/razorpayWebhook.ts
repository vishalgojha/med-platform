import { createClientFromRequest } from './_shared/server-client';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

async function verifyWebhookSignature(body, signature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(RAZORPAY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedSignature === signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature
    if (!signature || !await verifyWebhookSignature(body, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const appClient = createClientFromRequest(req);
    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    console.log("Razorpay webhook event:", eventType);

    switch (eventType) {
      case "subscription.activated":
      case "subscription.charged": {
        const subscription = payload.subscription?.entity;
        const payment = payload.payment?.entity;
        
        if (!subscription) break;

        const customerEmail = subscription.notes?.email || payment?.email;
        if (!customerEmail) {
          console.error("No customer email found in webhook");
          break;
        }

        // Find existing subscription or create new one
        const existing = await appClient.asServiceRole.entities.Subscription.filter({
          razorpay_subscription_id: subscription.id
        });

        const subscriptionData = {
          user_email: customerEmail,
          plan: subscription.notes?.plan || "premium",
          status: "active",
          razorpay_subscription_id: subscription.id,
          razorpay_payment_id: payment?.id,
          razorpay_customer_id: subscription.customer_id,
          amount: subscription.plan?.item?.amount,
          currency: subscription.plan?.item?.currency || "INR",
          billing_cycle: subscription.plan?.period === "yearly" ? "yearly" : "monthly",
          current_period_start: new Date(subscription.current_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_end * 1000).toISOString()
        };

        if (existing.length > 0) {
          await appClient.asServiceRole.entities.Subscription.update(existing[0].id, subscriptionData);
        } else {
          await appClient.asServiceRole.entities.Subscription.create(subscriptionData);
        }

        console.log(`Subscription activated/charged for ${customerEmail}`);
        break;
      }

      case "subscription.pending": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        const existing = await appClient.asServiceRole.entities.Subscription.filter({
          razorpay_subscription_id: subscription.id
        });

        if (existing.length > 0) {
          await appClient.asServiceRole.entities.Subscription.update(existing[0].id, {
            status: "pending"
          });
        }
        break;
      }

      case "subscription.halted":
      case "subscription.cancelled": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        const existing = await appClient.asServiceRole.entities.Subscription.filter({
          razorpay_subscription_id: subscription.id
        });

        if (existing.length > 0) {
          await appClient.asServiceRole.entities.Subscription.update(existing[0].id, {
            status: eventType === "subscription.cancelled" ? "cancelled" : "expired",
            cancelled_at: new Date().toISOString()
          });
        }
        console.log(`Subscription ${eventType} for ${subscription.id}`);
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        console.log("Payment failed:", payment?.id, payment?.error_description);
        
        // Optionally update subscription status
        if (payment?.subscription_id) {
          const existing = await appClient.asServiceRole.entities.Subscription.filter({
            razorpay_subscription_id: payment.subscription_id
          });

          if (existing.length > 0) {
            await appClient.asServiceRole.entities.Subscription.update(existing[0].id, {
              status: "failed"
            });
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});