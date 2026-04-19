import { NextResponse } from "next/server";
import {
  BookingActionError,
  submitBookingCancellation,
} from "@/lib/bookings/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type RequestBody = {
  bookingId?: string;
  reason?: string | null;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.bookingId) {
    return NextResponse.json(
      { error: "bookingId is required." },
      { status: 400 }
    );
  }

  try {
    const result = await submitBookingCancellation(
      {
        bookingId: body.bookingId,
        requesterUserId: user.id,
        reason: body.reason,
      },
      createSupabaseServiceClient()
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BookingActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Failed to submit booking cancellation:", error);
    return NextResponse.json(
      { error: "Failed to submit the cancellation." },
      { status: 500 }
    );
  }
}
