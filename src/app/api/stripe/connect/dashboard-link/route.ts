import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST() {
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
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (!mentor?.stripe_account_id || !mentor.stripe_onboarding_completed) {
    return NextResponse.json(
      { error: "Stripe onboarding not completed" },
      { status: 400 }
    );
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(
      mentor.stripe_account_id
    );
    return NextResponse.json({ url: loginLink.url });
  } catch (err) {
    console.error("Stripe dashboard link error:", err);
    return NextResponse.json(
      { error: "Failed to create dashboard link" },
      { status: 500 }
    );
  }
}
