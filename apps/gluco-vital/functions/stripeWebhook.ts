import { createClientFromRequest } from './_shared/server-client';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  const appClient = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("Received webhook, verifying signature...");

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("Webhook event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Checkout completed:", session.id);
        
        const userEmail = session.customer_email || session.metadata?.user_email;
        const plan = session.metadata?.plan;
        
        if (userEmail && userEmail !== "anonymous") {
          console.log("Creating subscription for:", userEmail, "plan:", plan);
          
          // Create subscription record
          await appClient.asServiceRole.entities.Subscription.create({
            user_email: userEmail,
            plan: plan,
            status: "active",
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            amount: session.amount_total,
            currency: session.currency?.toUpperCase() || "INR",
            billing_cycle: "monthly",
            current_period_start: new Date().toISOString()
          });
          
          console.log("Subscription record created successfully");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("Subscription updated:", subscription.id);
        
        const subscriptions = await appClient.asServiceRole.entities.Subscription.filter({
          stripe_subscription_id: subscription.id
        });
        
        if (subscriptions.length > 0) {
          await appClient.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status: subscription.status === "active" ? "active" : subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });
          console.log("Subscription record updated");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("Subscription cancelled:", subscription.id);
        
        const subscriptions = await appClient.asServiceRole.entities.Subscription.filter({
          stripe_subscription_id: subscription.id
        });
        
        if (subscriptions.length > 0) {
          await appClient.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
            status: "cancelled",
            cancelled_at: new Date().toISOString()
          });
          console.log("Subscription marked as cancelled");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("Invoice paid:", invoice.id);
        
        if (invoice.subscription) {
          const subscriptions = await appClient.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: invoice.subscription
          });
          
          if (subscriptions.length > 0) {
            await appClient.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status: "active",
              stripe_payment_id: invoice.payment_intent
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("Payment failed for invoice:", invoice.id);
        
        if (invoice.subscription) {
          const subscriptions = await appClient.asServiceRole.entities.Subscription.filter({
            stripe_subscription_id: invoice.subscription
          });
          
          if (subscriptions.length > 0) {
            await appClient.asServiceRole.entities.Subscription.update(subscriptions[0].id, {
              status: "failed"
            });
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});