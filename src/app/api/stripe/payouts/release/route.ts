import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";

function parseStoredTimestamp(value: string) {
  return new Date(/[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`);
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

  // 管理者認可チェック
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let paymentId: string;
  try {
    const body = await request.json();
    paymentId = body.paymentId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!paymentId) {
    return NextResponse.json(
      { error: "paymentId is required" },
      { status: 400 }
    );
  }

  const adminDb = createSupabaseServiceClient();

  // payment情報取得
  const { data: payment, error: paymentError } = await adminDb
    .from("payments")
    .select("id, booking_id, mentor_id, amount, currency, status")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  if (payment.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment is not in succeeded status" },
      { status: 400 }
    );
  }

  const { data: booking, error: bookingError } = await adminDb
    .from("bookings")
    .select("id, status, end_time")
    .eq("id", payment.booking_id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  if (booking.status !== "completed") {
    return NextResponse.json(
      {
        error:
          "The lesson must be marked completed before payout can be released.",
      },
      { status: 409 }
    );
  }

  const lessonEndTime = parseStoredTimestamp(booking.end_time);
  if (
    Number.isNaN(lessonEndTime.getTime()) ||
    lessonEndTime.getTime() > Date.now()
  ) {
    return NextResponse.json(
      { error: "The lesson must end before payout can be released." },
      { status: 409 }
    );
  }

  const pendingRequestResult = await adminDb
    .from("booking_change_requests")
    .select("id")
    .eq("booking_id", payment.booking_id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (pendingRequestResult.error) {
    return NextResponse.json(
      { error: "Failed to verify booking change request state." },
      { status: 500 }
    );
  }

  if (pendingRequestResult.data) {
    return NextResponse.json(
      {
        error:
          "Resolve pending booking change requests before payout can be released.",
      },
      { status: 409 }
    );
  }

  // 二重payout防止: 成功済みまたは処理中のpayoutがある場合は拒否（failedは再試行可能）
  const { data: existingPayout } = await adminDb
    .from("payouts")
    .select("id, status")
    .eq("payment_id", paymentId)
    .not("status", "eq", "failed")
    .maybeSingle();

  if (existingPayout) {
    return NextResponse.json(
      { error: "A payout for this payment has already been processed." },
      { status: 409 }
    );
  }

  // メンター情報取得
  const { data: mentor } = await adminDb
    .from("mentors")
    .select("stripe_account_id")
    .eq("id", payment.mentor_id)
    .single();

  if (!mentor?.stripe_account_id) {
    return NextResponse.json(
      { error: "Mentor Stripe account not found" },
      { status: 400 }
    );
  }

  try {
    // メンターへのpayoutを実行
    const payout = await stripe.payouts.create(
      { amount: payment.amount, currency: payment.currency },
      { stripeAccount: mentor.stripe_account_id }
    );

    // payoutsテーブルにレコード挿入
    const { error: insertError } = await adminDb.from("payouts").insert({
      payment_id: payment.id,
      mentor_id: payment.mentor_id,
      stripe_payout_id: payout.id,
      amount: payment.amount,
      status: "pending",
    });

    if (insertError) {
      // Stripe側ではpayoutが実行済みだがDBに記録されていない状態
      // payout.paidイベントで後からDBに反映される可能性があるが、ログに記録して手動対応可能にする
      console.error(
        `CRITICAL: Stripe payout created (${payout.id}) but DB insert failed for payment ${payment.id}:`,
        insertError
      );
      return NextResponse.json(
        { error: "Failed to save the payout record. Please contact an administrator." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, payoutId: payout.id });
  } catch (err) {
    console.error("Payout creation error:", err);
    return NextResponse.json(
      { error: "Failed to release the payout." },
      { status: 500 }
    );
  }
}
