import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";

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
  if (!isAdmin(user.id)) {
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

  // 二重payout防止: 成功済みまたは処理中のpayoutがある場合は拒否（failedは再試行可能）
  const { data: existingPayout } = await adminDb
    .from("payouts")
    .select("id, status")
    .eq("payment_id", paymentId)
    .not("status", "eq", "failed")
    .maybeSingle();

  if (existingPayout) {
    return NextResponse.json(
      { error: "この決済に対する入金は既に処理済みです" },
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
        { error: "入金処理のDB記録に失敗しました。管理者に連絡してください。" },
        { status: 500 }
      );
    }

    // bookings.status → 'completed'
    await adminDb
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", payment.booking_id);

    return NextResponse.json({ success: true, payoutId: payout.id });
  } catch (err) {
    console.error("Payout creation error:", err);
    return NextResponse.json(
      { error: "入金処理に失敗しました" },
      { status: 500 }
    );
  }
}
