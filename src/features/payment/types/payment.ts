import type {
  BookingStatus,
  PaymentStatus,
} from "@/features/bookings/types";
export type {
  BookingStatus,
  PaymentStatus,
} from "@/features/bookings/types";

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
