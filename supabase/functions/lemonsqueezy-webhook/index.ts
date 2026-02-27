// Supabase Edge Function: Handle Lemon Squeezy Webhooks
// Deploy with: supabase functions deploy lemonsqueezy-webhook
//
// Required secrets (set via Supabase dashboard or CLI):
//   LEMONSQUEEZY_WEBHOOK_SECRET  - Signing secret from Lemon Squeezy webhook settings
//   SUPABASE_URL                 - Auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY    - Auto-provided by Supabase (use service role to bypass RLS)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifySignature(payload: string, signature: string): boolean {
  const hmac = createHmac("sha256", WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest("hex");
  return digest === signature;
}

interface WebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id?: number;
      product_id: number;
      variant_id: number;
      status: string;
      card_brand: string | null;
      card_last_four: string | null;
      renews_at: string | null;
      ends_at: string | null;
      trial_ends_at: string | null;
      urls?: {
        update_payment_method?: string;
      };
      first_subscription_item?: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
      };
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signature || !verifySignature(body, signature)) {
    console.error("Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const payload: WebhookPayload = JSON.parse(body);
  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;

  console.log(`Received event: ${eventName}, user_id: ${userId}`);

  if (!userId) {
    console.error("No user_id in custom_data");
    return new Response("Missing user_id", { status: 400 });
  }

  const attrs = payload.data.attributes;
  const subscriptionData = {
    user_id: userId,
    lemon_squeezy_id: payload.data.id,
    order_id: attrs.order_id?.toString() ?? null,
    customer_id: attrs.customer_id.toString(),
    product_id: attrs.product_id.toString(),
    variant_id: attrs.variant_id.toString(),
    plan: "pro" as const,
    status: mapStatus(attrs.status),
    card_brand: attrs.card_brand,
    card_last_four: attrs.card_last_four,
    renews_at: attrs.renews_at,
    ends_at: attrs.ends_at,
    trial_ends_at: attrs.trial_ends_at,
    update_payment_method_url: attrs.urls?.update_payment_method ?? null,
  };

  try {
    switch (eventName) {
      case "subscription_created": {
        // Upsert: create or update subscription
        const { error } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: "user_id" });

        if (error) throw error;
        console.log(`Subscription created for user ${userId}`);
        break;
      }

      case "subscription_updated": {
        const { error } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: "user_id" });

        if (error) throw error;
        console.log(`Subscription updated for user ${userId}: ${attrs.status}`);
        break;
      }

      case "subscription_cancelled": {
        // Mark as cancelled but don't delete — user keeps access until ends_at
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            ends_at: attrs.ends_at,
          })
          .eq("user_id", userId);

        if (error) throw error;
        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      case "subscription_expired": {
        // Subscription has fully expired — downgrade to free
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "expired",
            ends_at: attrs.ends_at,
          })
          .eq("user_id", userId);

        if (error) throw error;
        console.log(`Subscription expired for user ${userId}`);
        break;
      }

      case "subscription_resumed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            renews_at: attrs.renews_at,
            ends_at: null,
          })
          .eq("user_id", userId);

        if (error) throw error;
        console.log(`Subscription resumed for user ${userId}`);
        break;
      }

      case "subscription_payment_success": {
        // Payment succeeded — ensure status is active
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            card_brand: attrs.card_brand,
            card_last_four: attrs.card_last_four,
            renews_at: attrs.renews_at,
          })
          .eq("user_id", userId);

        if (error) throw error;
        console.log(`Payment success for user ${userId}`);
        break;
      }

      case "subscription_payment_failed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", userId);

        if (error) throw error;
        console.log(`Payment failed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }
  } catch (err) {
    console.error(`Error processing ${eventName}:`, err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

function mapStatus(
  lsStatus: string,
):
  | "active"
  | "cancelled"
  | "expired"
  | "past_due"
  | "paused"
  | "on_trial"
  | "unpaid" {
  const statusMap: Record<
    string,
    | "active"
    | "cancelled"
    | "expired"
    | "past_due"
    | "paused"
    | "on_trial"
    | "unpaid"
  > = {
    active: "active",
    cancelled: "cancelled",
    expired: "expired",
    past_due: "past_due",
    paused: "paused",
    on_trial: "on_trial",
    unpaid: "unpaid",
  };
  return statusMap[lsStatus] ?? "active";
}
