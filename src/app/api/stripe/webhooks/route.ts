import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const adminDb = createSupabaseServiceClient();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        // 冪等性チェック
        const { data: payment } = await adminDb
          .from("payments")
          .select("id, status")
          .eq("stripe_payment_intent_id", pi.id)
          .single();

        if (!payment || payment.status === "succeeded") break;

        await adminDb
          .from("payments")
          .update({ status: "succeeded", paid_at: new Date().toISOString() })
          .eq("id", payment.id);

        // booking確認
        const bookingId = pi.metadata.booking_id;
        if (bookingId) {
          await adminDb
            .from("bookings")
            .update({ status: "confirmed", expires_at: null })
            .eq("id", bookingId)
            .eq("status", "pending");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { data: payment } = await adminDb
          .from("payments")
          .select("id, status")
          .eq("stripe_payment_intent_id", pi.id)
          .single();

        if (!payment || payment.status === "succeeded") break;

        await adminDb
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const isCompleted =
          account.charges_enabled === true &&
          account.payouts_enabled === true;

        await adminDb
          .from("mentors")
          .update({ stripe_onboarding_completed: isCompleted })
          .eq("stripe_account_id", account.id);
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        if (payout.id) {
          await adminDb
            .from("payouts")
            .update({ status: "paid" })
            .eq("stripe_payout_id", payout.id);
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        if (payout.id) {
          await adminDb
            .from("payouts")
            .update({ status: "failed" })
            .eq("stripe_payout_id", payout.id);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
