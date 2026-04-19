export type BookingStatus =
  | "pending"
  | "cancellation_requested"
  | "confirmed"
  | "completed"
  | "expired"
  | "cancelled"
  | "cancelled_by_mentor";

export type PaymentStatus =
  | "pending"
  | "refund_pending"
  | "succeeded"
  | "failed"
  | "refunded";

export type BookingChangeRequestType = "cancel";

export type BookingChangeRequestStatus = "pending" | "approved" | "rejected";

export type BookingChangeRequestSummary = {
  id: string;
  bookingId: string;
  requesterUserId: string;
  type: BookingChangeRequestType;
  status: BookingChangeRequestStatus;
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
