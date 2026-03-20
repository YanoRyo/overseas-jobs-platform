import type { BookingStatus, PaymentStatus } from "@/features/payment/types/payment";

/** フロントエンド表示用のレッスンモデル */
export type LessonItem = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  mentorName: string;
  mentorAvatarUrl: string | null;
  mentorCountry: string;
  amount: number | null;
  currency: string;
  paymentStatus: PaymentStatus | null;
};

/** ステータスごとにグループ化されたレッスン */
export type GroupedLessons = {
  upcoming: LessonItem[];
  pending: LessonItem[];
  completed: LessonItem[];
};
