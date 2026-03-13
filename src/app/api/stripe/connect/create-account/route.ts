import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST() {
  // 認証チェック
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = createSupabaseServiceClient();

  // メンター権限チェック
  const { data: mentor, error: mentorError } = await adminDb
    .from("mentors")
    .select("id, country_code, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (mentorError || !mentor) {
    return NextResponse.json(
      { error: "Mentor profile not found" },
      { status: 403 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    let accountId = mentor.stripe_account_id;

    // 既にstripe_account_idがある場合は新規AccountLink生成のみ
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: mentor.country_code || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: { schedule: { interval: "manual" } },
        },
      });
      accountId = account.id;

      // mentorsテーブルにstripe_account_idを保存
      await adminDb
        .from("mentors")
        .update({ stripe_account_id: accountId })
        .eq("id", mentor.id);
    }

    // オンボーディングURLを生成
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/settings?section=payout&refresh=true`,
      return_url: `${appUrl}/settings?section=payout&success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect account creation error:", err);
    return NextResponse.json(
      { error: "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}
