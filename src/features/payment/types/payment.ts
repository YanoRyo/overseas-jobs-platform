export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "expired"
  | "cancelled";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export type PayoutStatus = "pending" | "paid" | "failed";

export type PaymentRow = {
  id: string;
  booking_id: string;
  user_id: string;
  mentor_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PayoutRow = {
  id: string;
  payment_id: string;
  mentor_id: string;
  stripe_payout_id: string | null;
  amount: number;
  status: PayoutStatus;
  created_at: string;
  updated_at: string;
};
