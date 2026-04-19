import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import {
  approveBookingChangeRequest,
  BookingActionError,
  cancelBookingByAdmin,
  refundPayment,
} from "@/lib/bookings/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type RequestBody =
  | {
      action?: "cancel";
      bookingId?: string | number;
      note?: string | null;
      refundOnCancel?: boolean;
    }
  | {
      action?: "refund";
      paymentId?: string;
      note?: string | null;
    }
  | {
      action?: "approve_request";
      requestId?: string;
      note?: string | null;
      refundOnCancel?: boolean;
    };

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  const adminDb = createSupabaseServiceClient();

  try {
    switch (body.action) {
      case "cancel": {
        if (!body.bookingId) {
          return NextResponse.json(
            { error: "bookingId is required." },
            { status: 400 }
          );
        }

        await cancelBookingByAdmin(
          {
            bookingId: body.bookingId,
            reason: body.note,
            refundOnCancel: Boolean(body.refundOnCancel),
            reviewedBy: user.id,
          },
          adminDb
        );

        return NextResponse.json({ success: true });
      }

      case "refund": {
        if (!body.paymentId) {
          return NextResponse.json(
            { error: "paymentId is required." },
            { status: 400 }
          );
        }

        await refundPayment(
          {
            paymentId: body.paymentId,
            reason: body.note,
          },
          adminDb
        );

        return NextResponse.json({ success: true });
      }

      case "approve_request": {
        if (!body.requestId) {
          return NextResponse.json(
            { error: "requestId is required." },
            { status: 400 }
          );
        }

        await approveBookingChangeRequest(
          {
            requestId: body.requestId,
            reviewedBy: user.id,
            reviewNote: body.note,
            refundOnCancel: Boolean(body.refundOnCancel),
          },
          adminDb
        );

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Unsupported action." },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof BookingActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error("Reservation admin action failed:", error);
    return NextResponse.json(
      { error: "Failed to complete the reservation action." },
      { status: 500 }
    );
  }
}
