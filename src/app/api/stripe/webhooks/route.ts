import { NextResponse } from "next/server";
import Stripe from "stripe";
import { syncPaymentRefundFromStripe } from "@/lib/bookings/server";
import { sendBookingNotificationEmails } from "@/lib/email/bookingNotifications";
import { sendRefundCompletedEmail } from "@/lib/email/cancellationNotifications";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { issueMeetingLinksForBooking } from "@/lib/meetings/server";
import { calculateLessonFee } from "@/features/payment/constants/pricing";

type PaymentLookupRow = {
  id: string;
  booking_id: number;
  user_id: string;
  mentor_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
};

type BookingLookupRow = {
  id: number;
  user_id: string;
  mentor_id: string;
  start_time: string;
  end_time: string;
  status: string | null;
};

type MentorPricingRow = {
  id: string;
  hourly_rate: number | null;
};

const CONFIRMABLE_BOOKING_STATUSES = new Set([
  "pending",
  "expired",
  "confirmed",
]);

function webhookLog(
  message: string,
  context: Record<string, string | number | null | undefined>
) {
  console.info(`[stripe-webhook] ${message}`, context);
}

function webhookError(
  message: string,
  error: unknown,
  context: Record<string, string | number | null | undefined>
) {
  console.error(`[stripe-webhook] ${message}`, {
    ...context,
    error,
  });
}

function throwCoreWebhookError(
  message: string,
  error: unknown,
  context: Record<string, string | number | null | undefined>
): never {
  webhookError(message, error, context);
  throw error instanceof Error ? error : new Error(message);
}

function parseStoredTimestamp(value: string) {
  return new Date(/[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
}

function getPaymentIntentAmount(pi: Stripe.PaymentIntent) {
  return pi.amount_received > 0 ? pi.amount_received : pi.amount;
}

function isSameId(left: string | number | null | undefined, right: string | number) {
  return left != null && String(left) === String(right);
}

function buildPaymentIntentContext(
  event: Stripe.Event,
  pi: Stripe.PaymentIntent,
  bookingId?: string | number | null
) {
  return {
    eventType: event.type,
    eventId: event.id,
    paymentIntentId: pi.id,
    bookingId: bookingId == null ? null : String(bookingId),
  };
}

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
    webhookLog("received event", {
      eventType: event.type,
      eventId: event.id,
    });

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metadataBookingId = pi.metadata.booking_id || null;
        const metadataUserId = pi.metadata.user_id || null;
        const metadataMentorId = pi.metadata.mentor_id || null;
        const paidAt = pi.created
          ? new Date(pi.created * 1000).toISOString()
          : new Date().toISOString();
        const amount = getPaymentIntentAmount(pi);
        const context = buildPaymentIntentContext(event, pi, metadataBookingId);

        webhookLog("processing payment_intent.succeeded", {
          ...context,
          paymentIntentStatus: pi.status,
        });

        if (pi.status !== "succeeded") {
          webhookLog("skipping non-succeeded payment intent in succeeded handler", {
            ...context,
            paymentIntentStatus: pi.status,
          });
          break;
        }

        if (!metadataBookingId || !metadataUserId || !metadataMentorId) {
          webhookLog("skipping succeeded payment intent with incomplete metadata", {
            ...context,
            metadataUserId,
            metadataMentorId,
          });
          break;
        }

        const paymentByIntentResult = await adminDb
          .from("payments")
          .select(
            "id, booking_id, user_id, mentor_id, stripe_payment_intent_id, amount, currency, status"
          )
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle();

        if (paymentByIntentResult.error) {
          throwCoreWebhookError(
            "failed to fetch payment by payment intent",
            paymentByIntentResult.error,
            context
          );
        }

        let payment =
          (paymentByIntentResult.data as PaymentLookupRow | null) ?? null;
        const paymentFoundByIntent = Boolean(payment);

        if (payment && !isSameId(metadataBookingId, payment.booking_id)) {
          webhookLog("skipping payment intent because payment booking does not match metadata", {
            ...context,
            paymentBookingId: String(payment.booking_id),
          });
          break;
        }

        let bookingId: string | number = metadataBookingId;

        if (!payment && bookingId) {
          const paymentByBookingResult = await adminDb
            .from("payments")
            .select(
              "id, booking_id, user_id, mentor_id, stripe_payment_intent_id, amount, currency, status"
            )
            .eq("booking_id", bookingId)
            .maybeSingle();

          if (paymentByBookingResult.error) {
            throwCoreWebhookError(
              "failed to fetch payment by booking",
              paymentByBookingResult.error,
              context
            );
          } else {
            payment =
              (paymentByBookingResult.data as PaymentLookupRow | null) ?? null;
          }
        }

        if (
          payment &&
          !paymentFoundByIntent &&
          payment.stripe_payment_intent_id !== pi.id
        ) {
          webhookLog("skipping payment intent because booking has another payment intent", {
            ...context,
            existingPaymentIntentId: payment.stripe_payment_intent_id,
          });
          break;
        }

        const bookingResult = await adminDb
          .from("bookings")
          .select("id, user_id, mentor_id, start_time, end_time, status")
          .eq("id", bookingId)
          .maybeSingle();

        if (bookingResult.error) {
          throwCoreWebhookError("failed to fetch booking", bookingResult.error, context);
          break;
        }

        const booking = (bookingResult.data as BookingLookupRow | null) ?? null;
        if (!booking) {
          webhookLog("skipping succeeded payment intent without booking row", {
            eventType: event.type,
            paymentIntentId: pi.id,
            bookingId: String(bookingId),
          });
          break;
        }

        if (
          !isSameId(metadataBookingId, booking.id) ||
          metadataUserId !== booking.user_id ||
          metadataMentorId !== booking.mentor_id
        ) {
          webhookLog("skipping payment intent because booking metadata does not match", {
            ...context,
            bookingUserId: booking.user_id,
            bookingMentorId: booking.mentor_id,
            metadataUserId,
            metadataMentorId,
          });
          break;
        }

        if (payment) {
          const paymentMatchesBooking =
            payment.user_id === booking.user_id &&
            payment.mentor_id === booking.mentor_id &&
            payment.amount === amount &&
            payment.currency === pi.currency;

          if (!paymentMatchesBooking) {
            webhookLog("skipping payment intent because payment data does not match", {
              ...context,
              paymentUserId: payment.user_id,
              paymentMentorId: payment.mentor_id,
              paymentAmount: payment.amount,
              paymentCurrency: payment.currency,
              paymentIntentAmount: amount,
              paymentIntentCurrency: pi.currency,
            });
            break;
          }
        } else {
          const mentorResult = await adminDb
            .from("mentors")
            .select("id, hourly_rate")
            .eq("id", booking.mentor_id)
            .maybeSingle();

          if (mentorResult.error) {
            throwCoreWebhookError(
              "failed to fetch mentor pricing while recovering payment",
              mentorResult.error,
              context
            );
          }

          const mentor = (mentorResult.data as MentorPricingRow | null) ?? null;
          const startTime = parseStoredTimestamp(booking.start_time);
          const endTime = parseStoredTimestamp(booking.end_time);
          const durationMinutes =
            (endTime.getTime() - startTime.getTime()) / (1000 * 60);
          const expectedAmount =
            mentor?.hourly_rate != null && durationMinutes > 0
              ? calculateLessonFee(
                  Math.round(mentor.hourly_rate * 100),
                  durationMinutes
                )
              : null;

          if (expectedAmount !== amount || pi.currency !== "usd") {
            webhookLog("skipping payment recovery because amount is inconsistent", {
              ...context,
              expectedAmount,
              paymentIntentAmount: amount,
              paymentIntentCurrency: pi.currency,
            });
            break;
          }
        }

        // Recovery path: this repairs cases where Stripe succeeded before the
        // local payment row was visible, or after the booking had been marked
        // expired. The normal source of truth remains create-payment-intent.
        if (!payment) {
          const paymentUpsertResult = await adminDb
            .from("payments")
            .upsert(
              {
                booking_id: booking.id,
                user_id: booking.user_id,
                mentor_id: booking.mentor_id,
                stripe_payment_intent_id: pi.id,
                amount,
                currency: pi.currency,
                status: "succeeded",
                paid_at: paidAt,
              },
              { onConflict: "booking_id" }
            )
            .select("id, booking_id, status")
            .maybeSingle();

          if (paymentUpsertResult.error) {
            throwCoreWebhookError(
              "failed to upsert succeeded payment",
              paymentUpsertResult.error,
              context
            );
          } else {
            payment =
              (paymentUpsertResult.data as PaymentLookupRow | null) ?? payment;
          }
        } else if (
          payment.status !== "succeeded" &&
          payment.status !== "refunded" &&
          payment.status !== "refund_pending"
        ) {
          const paymentUpdateResult = await adminDb
            .from("payments")
            .update({
              status: "succeeded",
              paid_at: paidAt,
              stripe_payment_intent_id: pi.id,
              amount,
              currency: pi.currency,
            })
            .eq("id", payment.id);

          if (paymentUpdateResult.error) {
            throwCoreWebhookError(
              "failed to update payment status",
              paymentUpdateResult.error,
              context
            );
          }
        }

        if (CONFIRMABLE_BOOKING_STATUSES.has(booking.status ?? "")) {
          const bookingUpdateResult = await adminDb
            .from("bookings")
            .update({ status: "confirmed", expires_at: null })
            .eq("id", bookingId)
            .in("status", [...CONFIRMABLE_BOOKING_STATUSES]);

          if (bookingUpdateResult.error) {
            throwCoreWebhookError(
              "failed to confirm booking",
              bookingUpdateResult.error,
              context
            );
          }
        } else {
          webhookLog("booking status is not confirmable from webhook", {
            ...context,
            bookingStatus: booking.status,
          });
          break;
        }

        // Delivery side effects are intentionally best-effort. Core DB state
        // failures above throw 500 so Stripe retries; meeting/email failures are
        // logged and acknowledged to avoid duplicate core processing.
        try {
          await issueMeetingLinksForBooking(String(bookingId));
        } catch (error) {
          webhookError("meeting link issuance failed", error, {
            ...context,
          });
        }

        try {
          await sendBookingNotificationEmails(pi.id);
        } catch (error) {
          webhookError("booking notification email processing failed", error, {
            ...context,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { data: payment, error: paymentError } = await adminDb
          .from("payments")
          .select("id, status")
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle();

        if (paymentError) {
          throwCoreWebhookError(
            "failed to fetch payment for failure event",
            paymentError,
            buildPaymentIntentContext(event, pi, pi.metadata.booking_id || null)
          );
        }

        if (
          !payment ||
          payment.status === "succeeded" ||
          payment.status === "refunded"
        ) {
          break;
        }

        const { error: failUpdateError } = await adminDb
          .from("payments")
          .update({ status: "failed" })
          .eq("id", payment.id);

        if (failUpdateError) {
          throwCoreWebhookError(
            "failed to update payment failure status",
            failUpdateError,
            buildPaymentIntentContext(event, pi, pi.metadata.booking_id || null)
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (!paymentIntentId || charge.amount_refunded <= 0) {
          break;
        }

        const refunds = charge.refunds?.data ?? [];
        const latestRefund = refunds[refunds.length - 1] ?? null;

        const syncResult = await syncPaymentRefundFromStripe(
          {
            paymentIntentId,
            stripeRefundId: latestRefund?.id ?? null,
            refundAmount: charge.amount_refunded,
            refundedAt: latestRefund
              ? new Date(latestRefund.created * 1000).toISOString()
              : new Date().toISOString(),
            refundReason: latestRefund?.reason ?? null,
          },
          adminDb
        );

        if (syncResult?.statusChanged) {
          try {
            await sendRefundCompletedEmail({
              paymentIntentId,
              eventKey: `charge-refunded-${event.id}`,
            });
          } catch (notificationError) {
            console.error(
              "Refund completion email processing failed:",
              notificationError
            );
          }
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
            .maybeSingle();

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
              .maybeSingle();
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
    webhookError("unhandled processing error", err, {
      eventType: event.type,
      eventId: event.id,
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
