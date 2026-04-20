import type {
  BookingChangeRequestStatus,
  BookingChangeRequestType,
} from "@/features/bookings/types";

export type AdminTab = "overview" | "action_required" | "payments" | "logs";

export type AdminFlagTone = "info" | "warning" | "danger";

export type AdminCaseFlag = {
  type:
    | "awaiting_payout_approval"
    | "payment_failed"
    | "payment_refunded"
    | "refund_pending"
    | "expired_pending_booking"
    | "change_request_pending"
    | "mentor_cancelled"
    | "meeting_link_missing"
    | "meeting_setup_issue"
    | "mentor_payout_setup_incomplete"
    | "payout_failed";
  label: string;
  tone: AdminFlagTone;
};

export type AdminBookingChangeRequest = {
  id: string;
  requesterUserId: string;
  requesterDisplayName: string;
  requesterRole: string | null;
  type: BookingChangeRequestType;
  status: BookingChangeRequestStatus;
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type AdminReservationCase = {
  id: string;
  bookingId: number;
  status: string | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  meetingProvider: string | null;
  meetingJoinUrl: string | null;
  meetingHostUrl: string | null;
  meetingSetupIssue: {
    id: string;
    provider: string | null;
    errorSummary: string;
    occurredAt: string;
    status: "unresolved" | "resolved";
    failureCount: number;
  } | null;
  hasMeetingLink: boolean;
  paymentApprovalEligible: boolean;
  needsAttention: boolean;
  student: {
    id: string | null;
    displayName: string;
    username: string | null;
    role: string | null;
    avatarUrl: string | null;
    timezone: string | null;
    phone: string | null;
  };
  mentor: {
    id: string | null;
    userId: string | null;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
    timezone: string | null;
    hourlyRate: number | null;
    stripeOnboardingCompleted: boolean;
  } | null;
  payment: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paidAt: string | null;
    createdAt: string | null;
    refundAmount: number | null;
    refundedAt: string | null;
    refundReason: string | null;
    studentConfirmationEmailSentAt: string | null;
    mentorBookingEmailSentAt: string | null;
  } | null;
  payout: {
    id: string;
    status: string;
    amount: number;
    createdAt: string | null;
  } | null;
  changeRequests: AdminBookingChangeRequest[];
  flags: AdminCaseFlag[];
};

export type AdminUserCase = {
  id: string;
  displayName: string;
  username: string | null;
  role: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  phone: string | null;
  createdAt: string | null;
  hasMentorProfile: boolean;
  mentorProfileId: string | null;
  stateLabel: string;
  needsAttention: boolean;
  counts: {
    totalReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    completedReservations: number;
    failedPayments: number;
    refundedPayments: number;
    attentionCases: number;
  };
  lastReservationAt: string | null;
  recentReservationIds: number[];
};

export type AdminMentorCase = {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  countryCode: string | null;
  phone: string | null;
  hourlyRate: number | null;
  stripeOnboardingCompleted: boolean;
  stripeAccountId: string | null;
  createdAt: string | null;
  stateLabel: string;
  needsAttention: boolean;
  counts: {
    totalReservations: number;
    pendingReservations: number;
    confirmedReservations: number;
    completedReservations: number;
    awaitingPayoutApproval: number;
    paidPayouts: number;
    failedPayouts: number;
  };
  lastReservationAt: string | null;
  recentReservationIds: number[];
};

export type AdminOperationsResponse = {
  updatedAt: string;
  summary: {
    totalReservations: number;
    reservationsNeedingAttention: number;
    awaitingPayoutApproval: number;
    meetingSetupIssues: number;
    usersNeedingAttention: number;
    mentorsNeedingAttention: number;
    paymentFailures: number;
  };
  reservations: AdminReservationCase[];
  users: AdminUserCase[];
  mentors: AdminMentorCase[];
};
