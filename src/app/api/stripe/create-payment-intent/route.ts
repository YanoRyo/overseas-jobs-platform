import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { expirePendingBookings } from "@/lib/bookings/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { calculateLessonFee } from "@/features/payment/constants/pricing";

const IDEMPOTENCY_RETRY_DELAYS_MS = [250, 500, 1000, 2000] as const;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStripeIdempotencyKeyInUse(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeError &&
    error.code === "idempotency_key_in_use"
  );
}

export async function POST(request: Request) {
  // 認証チェック
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bookingId: string;
  try {
    const body = await request.json();
    bookingId = body.bookingId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!bookingId) {
    return NextResponse.json(
      { error: "bookingId is required" },
      { status: 400 }
    );
  }

  const adminDb = createSupabaseServiceClient();
  try {
    await expirePendingBookings(adminDb);
  } catch (error) {
    console.error("create-payment-intent lifecycle refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh booking lifecycle" },
      { status: 500 }
    );
  }

  // booking取得・所有権チェック
  const { data: booking, error: bookingError } = await adminDb
    .from("bookings")
    .select("id, user_id, mentor_id, start_time, end_time, status, expires_at")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "pending") {
    // 支払済みの場合はclientSecretを返してリダイレクトさせる
    const { data: paidPayment } = await adminDb
      .from("payments")
      .select("stripe_payment_intent_id, status")
      .eq("booking_id", bookingId)
      .single();

    if (paidPayment?.status === "succeeded") {
      const pi = await stripe.paymentIntents.retrieve(
        paidPayment.stripe_payment_intent_id
      );
      return NextResponse.json({
        alreadyPaid: true,
        clientSecret: pi.client_secret,
      });
    }

    return NextResponse.json(
      { error: "Booking is not in pending status" },
      { status: 400 }
    );
  }

  // 有効期限チェック
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This booking has expired." },
      { status: 400 }
    );
  }

  // 既存のpaymentレコードがあるか確認（二重作成防止。failedは除外し再作成を許可）
  async function fetchExistingPayment() {
    const { data, error } = await adminDb
      .from("payments")
      .select("stripe_payment_intent_id, amount")
      .eq("booking_id", bookingId)
      .neq("status", "failed")
      .maybeSingle();

    if (error) {
      console.error("Failed to check existing payment:", error);
      throw error;
    }

    return data;
  }

  const existingPayment = await fetchExistingPayment();

  if (existingPayment) {
    // 既存PaymentIntentの状態を確認
    const pi = await stripe.paymentIntents.retrieve(
      existingPayment.stripe_payment_intent_id
    );
    // 決済済み or 処理中の場合は完了扱いにする
    if (pi.status === "succeeded" || pi.status === "processing") {
      return NextResponse.json({
        alreadyPaid: true,
        clientSecret: pi.client_secret,
      });
    }
    return NextResponse.json({
      clientSecret: pi.client_secret,
      amount: existingPayment.amount,
    });
  }

  // メンターのStripe情報を取得
  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("id, stripe_account_id, hourly_rate")
    .eq("id", booking.mentor_id)
    .single();

  if (mentorError || !mentor || !mentor.stripe_account_id) {
    return NextResponse.json(
      { error: "This mentor is not accepting payments right now." },
      { status: 400 }
    );
  }

  // Stripe APIでリアルタイムにcharges_enabledを検証
  try {
    const account = await stripe.accounts.retrieve(mentor.stripe_account_id);
    if (!account.charges_enabled) {
      // DBの stripe_onboarding_completed も同期更新
      await adminDb
        .from("mentors")
        .update({ stripe_onboarding_completed: false })
        .eq("id", mentor.id);
      return NextResponse.json(
        { error: "This mentor is not accepting payments right now." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Stripe account retrieve error:", err);
    return NextResponse.json(
      { error: "Failed to verify payment information." },
      { status: 500 }
    );
  }

  // 金額をサーバーサイドで算出
  const durationMinutes =
    (new Date(booking.end_time).getTime() -
      new Date(booking.start_time).getTime()) /
    (1000 * 60);

  // 不正な時間データのバリデーション
  if (durationMinutes <= 0) {
    return NextResponse.json(
      { error: "The booking time data is invalid." },
      { status: 400 }
    );
  }

  // hourly_rateはドル単位（例: 30 = $30）で保存されているため、セントに変換
  const hourlyRateCents = Math.round(mentor.hourly_rate * 100);
  const amount = calculateLessonFee(hourlyRateCents, durationMinutes);

  // Stripeの最小金額チェック（USD: $0.50 = 50セント）
  if (amount < 50) {
    return NextResponse.json(
      { error: "The payment amount is below the minimum allowed amount." },
      { status: 400 }
    );
  }

  try {
    const paymentIntentPayload = {
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      transfer_data: { destination: mentor.stripe_account_id },
      metadata: {
        booking_id: String(booking.id),
        user_id: user.id,
        mentor_id: mentor.id,
      },
    } satisfies Stripe.PaymentIntentCreateParams;
    const idempotencyKey = `pi_${bookingId}`;

    let paymentIntent: Stripe.PaymentIntent | null = null;
    for (
      let attempt = 0;
      attempt <= IDEMPOTENCY_RETRY_DELAYS_MS.length;
      attempt += 1
    ) {
      try {
        paymentIntent = await stripe.paymentIntents.create(
          paymentIntentPayload,
          { idempotencyKey }
        );
        break;
      } catch (error) {
        if (
          !isStripeIdempotencyKeyInUse(error) ||
          attempt === IDEMPOTENCY_RETRY_DELAYS_MS.length
        ) {
          throw error;
        }

        await wait(IDEMPOTENCY_RETRY_DELAYS_MS[attempt]);

        const concurrentPayment = await fetchExistingPayment();
        if (concurrentPayment) {
          const pi = await stripe.paymentIntents.retrieve(
            concurrentPayment.stripe_payment_intent_id
          );
          return NextResponse.json({
            clientSecret: pi.client_secret,
            amount: concurrentPayment.amount,
          });
        }
      }
    }

    if (!paymentIntent) {
      throw new Error("PaymentIntent creation did not return a result.");
    }

    // paymentsテーブルにレコード挿入（既存レコードがある場合はUPDATE）
    const { error: upsertError } = await adminDb
      .from("payments")
      .upsert(
        {
          booking_id: booking.id,
          user_id: user.id,
          mentor_id: mentor.id,
          stripe_payment_intent_id: paymentIntent.id,
          amount,
          currency: "usd",
          status: "pending",
        },
        { onConflict: "booking_id" }
      );

    if (upsertError) {
      console.error(
        `CRITICAL: PaymentIntent created (${paymentIntent.id}) but payments upsert failed for booking ${booking.id}:`,
        upsertError
      );
      return NextResponse.json(
        { error: "Failed to save the payment record." },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    console.error("PaymentIntent creation error:", err);
    return NextResponse.json(
      { error: "Failed to initialize payment." },
      { status: 500 }
    );
  }
}
