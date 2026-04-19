import type { BookingChangeRequestSummary } from "@/features/bookings/types";
import type { BookingStatus, PaymentStatus } from "@/features/payment/types/payment";

/** フロントエンド表示用のレッスンモデル */
export type LessonItem = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  participantName: string;
  participantAvatarUrl: string | null;
  participantLabel: "Mentor" | "Student";
  amount: number | null;
  currency: string;
  paymentStatus: PaymentStatus | null;
  refundAmount: number | null;
  refundedAt: string | null;
  meetingUrl: string | null;
  meetingProvider: string | null;
  changeRequest: BookingChangeRequestSummary | null;
};

/** ステータスごとにグループ化されたレッスン */
export type GroupedLessons = {
  upcoming: LessonItem[];
  pending: LessonItem[];
  completed: LessonItem[];
  cancelled: LessonItem[];
};
