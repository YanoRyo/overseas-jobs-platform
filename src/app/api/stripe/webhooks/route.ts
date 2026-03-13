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

        const { error: updateError } = await adminDb
          .from("payments")
          .update({ status: "succeeded", paid_at: new Date().toISOString() })
          .eq("id", payment.id);

        if (updateError) {
          console.error("Failed to update payment status:", updateError);
          throw updateError;
        }

        // booking確認
        const bookingId = pi.metadata.booking_id;
        if (bookingId) {
          const { error: bookingUpdateError } = await adminDb
            .from("bookings")
            .update({ status: "confirmed", expires_at: null })
            .eq("id", bookingId)
            .eq("status", "pending");

          if (bookingUpdateError) {
            console.error("Failed to update booking status:", bookingUpdateError);
            throw bookingUpdateError;
          }
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

        const { error: failUpdateError } = await adminDb
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        if (failUpdateError) {
          console.error("Failed to update payment failure status:", failUpdateError);
          throw failUpdateError;
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const isCompleted =
          account.charges_enabled === true &&
          account.payouts_enabled === true;

        const { error: mentorUpdateError } = await adminDb
          .from("mentors")
          .update({ stripe_onboarding_completed: isCompleted })
          .eq("stripe_account_id", account.id);

        if (mentorUpdateError) {
          console.error("Failed to update mentor onboarding status:", mentorUpdateError);
          throw mentorUpdateError;
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        if (payout.id) {
          const { error: payoutUpdateError } = await adminDb
            .from("payouts")
            .update({ status: "paid" })
            .eq("stripe_payout_id", payout.id);

          if (payoutUpdateError) {
            console.error("Failed to update payout paid status:", payoutUpdateError);
            throw payoutUpdateError;
          }
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        if (payout.id) {
          // update と同時に payment_id を取得（1クエリで完結）
          const { data: payoutRecord, error: payoutFailError } = await adminDb
            .from("payouts")
            .update({ status: "failed" })
            .eq("stripe_payout_id", payout.id)
            .select("payment_id")
            .single();

          if (payoutFailError) {
            console.error("Failed to update payout failure status:", payoutFailError);
            throw payoutFailError;
          }

          // bookings.statusをconfirmedに戻して管理者が再承認できるようにする
          if (payoutRecord) {
            const { data: payment } = await adminDb
              .from("payments")
              .select("booking_id")
              .eq("id", payoutRecord.payment_id)
              .single();
            if (payment) {
              const { error: bookingRevertError } = await adminDb
                .from("bookings")
                .update({ status: "confirmed" })
                .eq("id", payment.booking_id);
              if (bookingRevertError) {
                console.error("Failed to revert booking status on payout failure:", bookingRevertError);
              }
            }
          }
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
