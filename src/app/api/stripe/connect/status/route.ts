import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminDb = createSupabaseServiceClient();

  const { data: mentor } = await adminDb
    .from("mentors")
    .select("id, stripe_account_id, stripe_onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (!mentor) {
    return NextResponse.json(
      { error: "Mentor profile not found" },
      { status: 403 }
    );
  }

  if (!mentor.stripe_account_id) {
    return NextResponse.json({
      hasAccount: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(mentor.stripe_account_id);

    // DB側のフラグも同期更新
    const isCompleted =
      account.charges_enabled === true && account.payouts_enabled === true;
    if (isCompleted !== mentor.stripe_onboarding_completed) {
      await adminDb
        .from("mentors")
        .update({ stripe_onboarding_completed: isCompleted })
        .eq("id", mentor.id);
    }

    return NextResponse.json({
      hasAccount: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (err) {
    console.error("Stripe account retrieve error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve Stripe account status" },
      { status: 500 }
    );
  }
}
