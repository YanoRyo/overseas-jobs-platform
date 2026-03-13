import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { calculateLessonFee } from "@/features/payment/constants/pricing";

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

    if (paidPayment && (paidPayment.status === "succeeded" || paidPayment.status === "pending")) {
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
      { error: "予約の有効期限が切れました" },
      { status: 400 }
    );
  }

  // 既存のpaymentレコードがあるか確認（二重作成防止。failedは除外し再作成を許可）
  const { data: existingPayment } = await adminDb
    .from("payments")
    .select("stripe_payment_intent_id, amount")
    .eq("booking_id", bookingId)
    .neq("status", "failed")
    .single();

  if (existingPayment) {
    // 既存PaymentIntentのclientSecretを返す
    const pi = await stripe.paymentIntents.retrieve(
      existingPayment.stripe_payment_intent_id
    );
    return NextResponse.json({ clientSecret: pi.client_secret, amount: existingPayment.amount });
  }

  // メンターのStripe情報を取得
  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("id, stripe_account_id, hourly_rate")
    .eq("id", booking.mentor_id)
    .single();

  if (mentorError || !mentor || !mentor.stripe_account_id) {
    return NextResponse.json(
      { error: "このメンターは現在決済を受け付けていません" },
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
        { error: "このメンターは現在決済を受け付けていません" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Stripe account retrieve error:", err);
    return NextResponse.json(
      { error: "決済情報の確認に失敗しました" },
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
      { error: "予約の時間データが不正です" },
      { status: 400 }
    );
  }

  // hourly_rateはドル単位（例: 30 = $30）で保存されているため、セントに変換
  const hourlyRateCents = Math.round(mentor.hourly_rate * 100);
  const amount = calculateLessonFee(hourlyRateCents, durationMinutes);

  // Stripeの最小金額チェック（USD: $0.50 = 50セント）
  if (amount < 50) {
    return NextResponse.json(
      { error: "決済金額が最低金額を下回っています" },
      { status: 400 }
    );
  }

  try {
    // PaymentIntent作成
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        transfer_data: { destination: mentor.stripe_account_id },
        metadata: {
          booking_id: booking.id,
          user_id: user.id,
          mentor_id: mentor.id,
        },
      },
      { idempotencyKey: `pi_${bookingId}` }
    );

    // paymentsテーブルにレコード挿入
    const { error: insertError } = await adminDb.from("payments").insert({
      booking_id: booking.id,
      user_id: user.id,
      mentor_id: mentor.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency: "usd",
      status: "pending",
    });

    if (insertError) {
      console.error(
        `CRITICAL: PaymentIntent created (${paymentIntent.id}) but payments INSERT failed for booking ${booking.id}:`,
        insertError
      );
      return NextResponse.json(
        { error: "決済情報のDB記録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    console.error("PaymentIntent creation error:", err);
    return NextResponse.json(
      { error: "決済の初期化に失敗しました" },
      { status: 500 }
    );
  }
}
