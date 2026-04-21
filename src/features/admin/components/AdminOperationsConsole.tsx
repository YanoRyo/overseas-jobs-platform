"use client";

import { RefreshCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import type {
  AdminBookingChangeRequest,
  AdminCaseFlag,
  AdminFlagTone,
  AdminOperationsResponse,
  AdminSupportRequest,
  AdminSupportRequestsResponse,
  AdminReservationCase,
  AdminTab,
} from "../types";

type PaymentReservationCase = AdminReservationCase & {
  payment: NonNullable<AdminReservationCase["payment"]>;
};

type CancellationActionItem = {
  reservation: AdminReservationCase;
  request: AdminBookingChangeRequest;
};

type MeetingSetupActionItem = {
  reservation: AdminReservationCase;
  issue: NonNullable<AdminReservationCase["meetingSetupIssue"]>;
};

type PaymentViewFilter =
  | "action_required"
  | "all"
  | "cancellation_pending"
  | "confirmed"
  | "completion_due"
  | "payout_pending"
  | "refund_pending";

type SupportViewFilter = "open" | "replied" | "all";

type ActionRequiredFocus =
  | "all"
  | "cancellation_requests"
  | "lesson_completion"
  | "payout_approvals"
  | "meeting_setup_issues";

type Tone = AdminFlagTone | "success" | "neutral";

const TAB_OPTIONS: AdminTab[] = [
  "overview",
  "action_required",
  "payments",
  "support",
  "logs",
];

const ACTION_REQUIRED_FILTERS: ActionRequiredFocus[] = [
  "all",
  "cancellation_requests",
  "lesson_completion",
  "payout_approvals",
  "meeting_setup_issues",
];

const PAYMENT_FILTERS: PaymentViewFilter[] = [
  "action_required",
  "confirmed",
  "all",
  "cancellation_pending",
  "completion_due",
  "payout_pending",
  "refund_pending",
];

const SUPPORT_FILTERS: SupportViewFilter[] = ["open", "replied", "all"];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function parseAppDate(value: string | null | undefined) {
  if (!value) return null;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}Z`);
}

function getTimestamp(value: string | null | undefined) {
  const date = parseAppDate(value);
  return date?.getTime() ?? 0;
}

function formatDateTime(value: string | null | undefined) {
  const date = parseAppDate(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimestamp(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return formatDateTime(new Date(value).toISOString());
}

function formatCurrency(amount: number | null | undefined, currency = "usd") {
  if (amount == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function pickSelectedItem<T extends { id: string }>(
  items: T[],
  selectedId: string | null
) {
  if (selectedId) {
    const match = items.find((item) => item.id === selectedId);
    if (match) return match;
  }
  return items[0] ?? null;
}

function toneClassName(tone: Tone) {
  switch (tone) {
    case "danger":
      return "bg-rose-100 text-rose-700";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "info":
      return "bg-sky-100 text-sky-700";
    case "success":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function humanizeToken(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function bookingStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "cancellation_requested":
    case "pending":
      return "warning";
    case "cancelled":
    case "cancelled_by_mentor":
    case "expired":
      return "danger";
    case "completed":
      return "neutral";
    case "confirmed":
      return "info";
    default:
      return "neutral";
  }
}

function paymentStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "pending":
    case "refund_pending":
      return "warning";
    case "failed":
      return "danger";
    case "succeeded":
    case "refunded":
      return "neutral";
    default:
      return "neutral";
  }
}

function supportStatusTone(status: "open" | "replied"): Tone {
  return status === "open" ? "warning" : "neutral";
}

function deliveryStatusTone(status: "pending" | "sent" | "failed"): Tone {
  switch (status) {
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "success";
  }
}

function payoutStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    case "paid":
      return "neutral";
    default:
      return "neutral";
  }
}

function searchMatches(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function renderFlagBadges(flags: AdminCaseFlag[]) {
  return (
    <>
      {flags.map((flag) => (
        <Badge key={flag.type} label={flag.label} tone={flag.tone} />
      ))}
    </>
  );
}

function isPaymentReservationCase(
  reservation: AdminReservationCase
): reservation is PaymentReservationCase {
  return reservation.payment !== null;
}

function hasPendingCancellationRequest(reservation: AdminReservationCase) {
  return reservation.changeRequests.some((request) => request.status === "pending");
}

function isConfirmedReservation(reservation: AdminReservationCase) {
  return reservation.status === "confirmed";
}

function hasPayoutPending(reservation: PaymentReservationCase) {
  return reservation.paymentApprovalEligible;
}

function hasLessonCompletionDue(reservation: PaymentReservationCase) {
  return reservation.lessonCompletionEligible;
}

function hasRefundPending(reservation: PaymentReservationCase) {
  return reservation.payment.status === "refund_pending";
}

function hasMeetingSetupIssue(reservation: AdminReservationCase) {
  return reservation.meetingSetupIssue?.status === "unresolved";
}

function isActionRequiredReservation(reservation: AdminReservationCase) {
  return (
    hasPendingCancellationRequest(reservation) ||
    hasMeetingSetupIssue(reservation) ||
    (isPaymentReservationCase(reservation) &&
      (hasLessonCompletionDue(reservation) ||
        hasPayoutPending(reservation) ||
        hasRefundPending(reservation)))
  );
}

function isLogReservation(reservation: AdminReservationCase) {
  return (
    (reservation.status === "completed" && !reservation.paymentApprovalEligible) ||
    reservation.status === "expired" ||
    reservation.status === "cancelled" ||
    reservation.status === "cancelled_by_mentor" ||
    reservation.payment?.status === "refunded" ||
    reservation.payout?.status === "paid"
  );
}

function getCaseActivityTimestamp(reservation: AdminReservationCase) {
  return Math.max(
    getTimestamp(reservation.payment?.refundedAt),
    getTimestamp(reservation.payment?.paidAt),
    getTimestamp(reservation.payout?.createdAt),
    getTimestamp(reservation.startTime),
    getTimestamp(reservation.createdAt)
  );
}

function buildReservationSearchHaystack(reservation: AdminReservationCase) {
  return [
    reservation.bookingId,
    reservation.status,
    reservation.student.displayName,
    reservation.student.username,
    reservation.mentor?.displayName,
    reservation.mentor?.email,
    reservation.payment?.status,
    reservation.payout?.status,
    reservation.meetingSetupIssue?.provider,
    reservation.meetingSetupIssue?.errorSummary,
    ...reservation.changeRequests.flatMap((request) => [
      request.type,
      request.status,
      request.reason,
      request.requesterDisplayName,
    ]),
    ...reservation.flags.map((flag) => flag.label),
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPaymentSearchHaystack(reservation: PaymentReservationCase) {
  return [
    reservation.bookingId,
    reservation.payment.id,
    reservation.payment.status,
    reservation.payout?.status,
    reservation.meetingSetupIssue?.provider,
    reservation.meetingSetupIssue?.errorSummary,
    reservation.student.displayName,
    reservation.mentor?.displayName,
    ...reservation.changeRequests.flatMap((request) => [
      request.type,
      request.status,
      request.reason,
      request.requesterDisplayName,
    ]),
    ...reservation.flags.map((flag) => flag.label),
  ]
    .filter(Boolean)
    .join(" ");
}

function buildSupportRequestSearchHaystack(request: AdminSupportRequest) {
  return [
    request.id,
    request.name,
    request.email,
    request.category,
    request.context,
    request.message,
    request.locale,
    request.status,
    request.lastRepliedByDisplayName,
    ...request.replies.flatMap((reply) => [
      reply.subject,
      reply.body,
      reply.deliveryStatus,
      reply.senderDisplayName,
      reply.deliveryError,
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        toneClassName(tone)
      )}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  description,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  description: string;
  tone: Tone;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "rounded-2xl border border-[#e5e7eb] bg-white p-5 text-left shadow-sm transition hover:border-[#cfd3e1]",
        onClick && "cursor-pointer"
      )}
    >
      <Badge label={label} tone={tone} />
      <p className="mt-4 text-3xl font-semibold text-[#1f1f2d]">{value}</p>
      <p className="mt-2 text-sm text-[#606579]">{description}</p>
    </div>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d5d7df] bg-[#fcfcfd] px-6 py-10 text-center">
      <p className="text-sm font-semibold text-[#1f1f2d]">{title}</p>
      <p className="mt-2 text-sm text-[#606579]">{description}</p>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-[#fcfcfd] p-4">
      <h4 className="text-sm font-semibold text-[#1f1f2d]">{title}</h4>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-[#606579]">{label}</span>
      <span className="text-right font-medium text-[#1f1f2d]">{value}</span>
    </div>
  );
}

function QueueCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-2xl border bg-white p-4 transition",
        onSelect && "cursor-pointer",
        selected
          ? "border-[#1f1f2d] bg-[#f8f8fb]"
          : "border-[#e5e7eb] hover:border-[#cfd3e1]"
      )}
    >
      {children}
    </div>
  );
}

function ChangeRequestCard({
  request,
  onApprove,
  processing,
}: {
  request: AdminBookingChangeRequest;
  onApprove?: (request: AdminBookingChangeRequest) => void;
  processing?: boolean;
}) {
  const t = useTranslations("admin.operations");

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1f1f2d]">
            {t("changeRequest.title")}
          </p>
          <p className="mt-1 text-xs text-[#606579]">
            {t("changeRequest.requestedBy", {
              name: request.requesterDisplayName,
            })}
            {request.requesterRole ? ` · ${request.requesterRole}` : ""} ·{" "}
            {formatDateTime(request.createdAt)}
          </p>
        </div>
        <Badge
          label={humanizeToken(request.status)}
          tone={
            request.status === "pending"
              ? "warning"
              : request.status === "approved"
                ? "neutral"
                : "danger"
          }
        />
      </div>

      {request.reason ? (
        <p className="mt-3 text-sm text-[#1f1f2d]">{request.reason}</p>
      ) : null}

      {request.reviewNote ? (
        <p className="mt-2 text-xs text-[#606579]">
          {t("changeRequest.reviewNote", { note: request.reviewNote })}
        </p>
      ) : null}

      {request.status === "pending" && onApprove ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => onApprove(request)}
            className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing
              ? t("actions.approvingCancellation")
              : t("actions.approveCancellation")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExternalLinkValue({
  url,
}: {
  url: string | null | undefined;
}) {
  if (!url) {
    return <span>-</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="break-all text-[#2563eb] underline underline-offset-2"
    >
      {url}
    </a>
  );
}

function MeetingSetupIssueDetail({
  reservation,
}: {
  reservation: AdminReservationCase;
}) {
  const t = useTranslations("admin.operations");
  const issue = reservation.meetingSetupIssue;

  if (!issue) {
    return null;
  }

  return (
    <DetailBlock title={t("detail.meetingSetupIssue")}>
      <DetailRow
        label={t("detail.status")}
        value={humanizeToken(issue.status)}
      />
      <DetailRow
        label={t("detail.meetingProvider")}
        value={issue.provider ? humanizeToken(issue.provider) : "-"}
      />
      <DetailRow
        label={t("detail.errorSummary")}
        value={issue.errorSummary}
      />
      <DetailRow
        label={t("detail.occurredAt")}
        value={formatDateTime(issue.occurredAt)}
      />
      <DetailRow
        label={t("detail.meetingStatus")}
        value={reservation.hasMeetingLink ? t("states.ready") : t("states.notReady")}
      />
    </DetailBlock>
  );
}

function MeetingLinkEditor({
  reservation,
  processingKey,
  onSaveMeetingLinks,
  onReissueMeetingLinks,
}: {
  reservation: AdminReservationCase;
  processingKey?: string | null;
  onSaveMeetingLinks?: (
    reservation: AdminReservationCase,
    values: {
      meetingProvider: string;
      meetingJoinUrl: string;
      meetingHostUrl: string | null;
    }
  ) => void;
  onReissueMeetingLinks?: (reservation: AdminReservationCase) => void;
}) {
  const t = useTranslations("admin.operations");
  const [meetingProvider, setMeetingProvider] = useState(
    reservation.meetingProvider ?? "manual"
  );
  const [meetingJoinUrl, setMeetingJoinUrl] = useState(
    reservation.meetingJoinUrl ?? ""
  );
  const [meetingHostUrl, setMeetingHostUrl] = useState(
    reservation.meetingHostUrl ?? ""
  );

  useEffect(() => {
    setMeetingProvider(reservation.meetingProvider ?? "manual");
    setMeetingJoinUrl(reservation.meetingJoinUrl ?? "");
    setMeetingHostUrl(reservation.meetingHostUrl ?? "");
  }, [
    reservation.id,
    reservation.meetingHostUrl,
    reservation.meetingJoinUrl,
    reservation.meetingProvider,
  ]);

  const saveProcessing = processingKey === `meeting:${reservation.id}`;
  const reissueProcessing = processingKey === `meeting_reissue:${reservation.id}`;

  return (
    <DetailBlock title={t("detail.meetingLinks")}>
      <div className="space-y-4">
        <div className="space-y-2">
          <DetailRow
            label={t("detail.meetingProvider")}
            value={
              reservation.meetingProvider
                ? humanizeToken(reservation.meetingProvider)
                : "-"
            }
          />
          <DetailRow
            label={t("detail.meetingJoinUrl")}
            value={<ExternalLinkValue url={reservation.meetingJoinUrl} />}
          />
          <DetailRow
            label={t("detail.meetingHostUrl")}
            value={<ExternalLinkValue url={reservation.meetingHostUrl} />}
          />
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm text-[#606579]">
            <span>{t("meetingForm.providerLabel")}</span>
            <input
              value={meetingProvider}
              onChange={(event) => setMeetingProvider(event.target.value)}
              placeholder={t("meetingForm.providerPlaceholder")}
              className="rounded-xl border border-[#d5d7df] bg-white px-3 py-2 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>

          <label className="grid gap-1.5 text-sm text-[#606579]">
            <span>{t("meetingForm.joinUrlLabel")}</span>
            <input
              value={meetingJoinUrl}
              onChange={(event) => setMeetingJoinUrl(event.target.value)}
              placeholder="https://"
              className="rounded-xl border border-[#d5d7df] bg-white px-3 py-2 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>

          <label className="grid gap-1.5 text-sm text-[#606579]">
            <span>{t("meetingForm.hostUrlLabel")}</span>
            <input
              value={meetingHostUrl}
              onChange={(event) => setMeetingHostUrl(event.target.value)}
              placeholder={t("meetingForm.hostUrlPlaceholder")}
              className="rounded-xl border border-[#d5d7df] bg-white px-3 py-2 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>
          <p className="text-xs text-[#606579]">{t("meetingForm.hostUrlHint")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onSaveMeetingLinks ? (
            <button
              type="button"
              disabled={saveProcessing || !meetingJoinUrl.trim()}
              onClick={() =>
                onSaveMeetingLinks(reservation, {
                  meetingProvider,
                  meetingJoinUrl,
                  meetingHostUrl: meetingHostUrl.trim() || null,
                })
              }
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveProcessing
                ? t("actions.savingMeetingLink")
                : t("actions.saveMeetingLink")}
            </button>
          ) : null}

          {onReissueMeetingLinks ? (
            <button
              type="button"
              disabled={reissueProcessing}
              onClick={() => onReissueMeetingLinks(reservation)}
              className="rounded-xl border border-[#d5d7df] px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reissueProcessing
                ? t("actions.reissuingMeetingLink")
                : t("actions.reissueMeetingLink")}
            </button>
          ) : null}
        </div>
      </div>
    </DetailBlock>
  );
}

function ReservationDetail({
  reservation,
  onApproveRequest,
  onSaveMeetingLinks,
  onReissueMeetingLinks,
  processingKey,
}: {
  reservation: AdminReservationCase | null;
  onApproveRequest?: (
    reservation: AdminReservationCase,
    request: AdminBookingChangeRequest
  ) => void;
  onSaveMeetingLinks?: (
    reservation: AdminReservationCase,
    values: {
      meetingProvider: string;
      meetingJoinUrl: string;
      meetingHostUrl: string | null;
    }
  ) => void;
  onReissueMeetingLinks?: (reservation: AdminReservationCase) => void;
  processingKey?: string | null;
}) {
  const t = useTranslations("admin.operations");

  if (!reservation) {
    return (
      <EmptyState
        title={t("empty.selectCaseTitle")}
        description={t("empty.selectCaseDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">{t("detail.reservationCase")}</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              {t("labels.bookingNumber", { id: reservation.bookingId })}
            </h3>
            <p className="mt-2 text-sm text-[#606579]">
              {reservation.student.displayName} x{" "}
              {reservation.mentor?.displayName ?? t("states.unknownMentor")}
            </p>
          </div>
          <Badge
            label={humanizeToken(reservation.status)}
            tone={bookingStatusTone(reservation.status)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {reservation.payment ? (
            <Badge
              label={t("labels.paymentStatusBadge", {
                status: humanizeToken(reservation.payment.status),
              })}
              tone={paymentStatusTone(reservation.payment.status)}
            />
          ) : null}
          {reservation.payout ? (
            <Badge
              label={t("labels.payoutStatusBadge", {
                status: humanizeToken(reservation.payout.status),
              })}
              tone={payoutStatusTone(reservation.payout.status)}
            />
          ) : null}
          {renderFlagBadges(reservation.flags)}
        </div>
      </div>

      <DetailBlock title={t("detail.reservation")}>
        <DetailRow
          label={t("detail.lessonTime")}
          value={`${formatDateTime(reservation.startTime)} - ${formatDateTime(
            reservation.endTime
          )}`}
        />
        <DetailRow label={t("detail.created")} value={formatDateTime(reservation.createdAt)} />
        <DetailRow label={t("detail.expires")} value={formatDateTime(reservation.expiresAt)} />
        <DetailRow
          label={t("detail.meeting")}
          value={
            reservation.hasMeetingLink
              ? reservation.meetingProvider
                ? humanizeToken(reservation.meetingProvider)
                : t("states.ready")
              : t("states.notReady")
          }
        />
        <DetailRow
          label={t("detail.meetingJoinUrl")}
          value={<ExternalLinkValue url={reservation.meetingJoinUrl} />}
        />
        <DetailRow
          label={t("detail.meetingHostUrl")}
          value={<ExternalLinkValue url={reservation.meetingHostUrl} />}
        />
      </DetailBlock>

      <MeetingSetupIssueDetail reservation={reservation} />

      <MeetingLinkEditor
        reservation={reservation}
        processingKey={processingKey}
        onSaveMeetingLinks={onSaveMeetingLinks}
        onReissueMeetingLinks={onReissueMeetingLinks}
      />

      <DetailBlock title={t("detail.student")}>
        <DetailRow label={t("detail.name")} value={reservation.student.displayName} />
        <DetailRow
          label={t("detail.handle")}
          value={
            reservation.student.username ? `@${reservation.student.username}` : "-"
          }
        />
        <DetailRow label={t("detail.role")} value={reservation.student.role ?? "-"} />
        <DetailRow label={t("detail.timezone")} value={reservation.student.timezone ?? "-"} />
        <DetailRow label={t("detail.phone")} value={reservation.student.phone ?? "-"} />
      </DetailBlock>

      <DetailBlock title={t("detail.mentor")}>
        <DetailRow
          label={t("detail.name")}
          value={reservation.mentor?.displayName ?? t("states.unknownMentor")}
        />
        <DetailRow label={t("detail.email")} value={reservation.mentor?.email ?? "-"} />
        <DetailRow label={t("detail.timezone")} value={reservation.mentor?.timezone ?? "-"} />
        <DetailRow
          label={t("detail.hourlyRate")}
          value={
            reservation.mentor?.hourlyRate != null
              ? `$${reservation.mentor.hourlyRate}/hr`
              : "-"
          }
        />
        <DetailRow
          label={t("detail.stripeReady")}
          value={
            reservation.mentor?.stripeOnboardingCompleted
              ? t("states.yes")
              : t("states.no")
          }
        />
      </DetailBlock>

      <DetailBlock title={t("detail.payment")}>
        <DetailRow
          label={t("detail.amount")}
          value={
            reservation.payment
              ? formatCurrency(
                  reservation.payment.amount,
                  reservation.payment.currency
                )
              : "-"
          }
        />
        <DetailRow
          label={t("detail.paymentStatus")}
          value={
            reservation.payment ? humanizeToken(reservation.payment.status) : "-"
          }
        />
        <DetailRow
          label={t("detail.payoutStatus")}
          value={reservation.payout ? humanizeToken(reservation.payout.status) : "-"}
        />
        <DetailRow label={t("detail.paidAt")} value={formatDateTime(reservation.payment?.paidAt)} />
        <DetailRow
          label={t("detail.refundAmount")}
          value={
            reservation.payment?.refundAmount != null
              ? formatCurrency(
                  reservation.payment.refundAmount,
                  reservation.payment.currency
                )
              : "-"
          }
        />
        <DetailRow
          label={t("detail.refundedAt")}
          value={formatDateTime(reservation.payment?.refundedAt)}
        />
        <DetailRow
          label={t("detail.refundReason")}
          value={reservation.payment?.refundReason ?? "-"}
        />
      </DetailBlock>

      <DetailBlock title={t("detail.changeRequests")}>
        {reservation.changeRequests.length > 0 ? (
          <div className="space-y-3">
            {reservation.changeRequests.map((request) => (
              <ChangeRequestCard
                key={request.id}
                request={request}
                onApprove={
                  onApproveRequest
                    ? (currentRequest) =>
                        onApproveRequest(reservation, currentRequest)
                    : undefined
                }
                processing={processingKey === `approve_request:${request.id}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#606579]">{t("empty.noCancellationRequests")}</p>
        )}
      </DetailBlock>
    </div>
  );
}

function PaymentDetail({
  reservation,
  onCompleteBooking,
  onApprovePayout,
  onRefundPayment,
  onApproveRequest,
  onSaveMeetingLinks,
  onReissueMeetingLinks,
  processingKey,
}: {
  reservation: PaymentReservationCase | null;
  onCompleteBooking?: (reservation: PaymentReservationCase) => void;
  onApprovePayout?: (reservation: PaymentReservationCase) => void;
  onRefundPayment?: (reservation: PaymentReservationCase) => void;
  onApproveRequest?: (
    reservation: AdminReservationCase,
    request: AdminBookingChangeRequest
  ) => void;
  onSaveMeetingLinks?: (
    reservation: AdminReservationCase,
    values: {
      meetingProvider: string;
      meetingJoinUrl: string;
      meetingHostUrl: string | null;
    }
  ) => void;
  onReissueMeetingLinks?: (reservation: AdminReservationCase) => void;
  processingKey?: string | null;
}) {
  const t = useTranslations("admin.operations");

  if (!reservation) {
    return (
      <EmptyState
        title={t("empty.selectPaymentTitle")}
        description={t("empty.selectPaymentDescription")}
      />
    );
  }

  const payoutProcessing = processingKey === `payout:${reservation.payment.id}`;
  const completeProcessing = processingKey === `complete:${reservation.bookingId}`;
  const refundProcessing = processingKey === `refund:${reservation.payment.id}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">{t("detail.paymentCase")}</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              {formatCurrency(
                reservation.payment.amount,
                reservation.payment.currency
              )}
            </h3>
            <p className="mt-2 text-sm text-[#606579]">
              {t("labels.bookingNumber", { id: reservation.bookingId })} ·{" "}
              {reservation.student.displayName} x{" "}
              {reservation.mentor?.displayName ?? t("states.unknownMentor")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              label={humanizeToken(reservation.payment.status)}
              tone={paymentStatusTone(reservation.payment.status)}
            />
            {reservation.payout ? (
              <Badge
                label={t("labels.payoutStatusBadge", {
                  status: humanizeToken(reservation.payout.status),
                })}
                tone={payoutStatusTone(reservation.payout.status)}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {reservation.lessonCompletionEligible && onCompleteBooking ? (
            <button
              type="button"
              disabled={completeProcessing}
              onClick={() => onCompleteBooking(reservation)}
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completeProcessing
                ? t("actions.completingLesson")
                : t("actions.completeLesson")}
            </button>
          ) : null}
          {reservation.paymentApprovalEligible && onApprovePayout ? (
            <button
              type="button"
              disabled={payoutProcessing}
              onClick={() => onApprovePayout(reservation)}
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payoutProcessing
                ? t("actions.approvingPayout")
                : t("actions.approvePayout")}
            </button>
          ) : null}
          {reservation.payment.status === "succeeded" && onRefundPayment ? (
            <button
              type="button"
              disabled={refundProcessing}
              onClick={() => onRefundPayment(reservation)}
              className="rounded-xl border border-[#d5d7df] px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refundProcessing
                ? t("actions.refundingPayment")
                : t("actions.refundPayment")}
            </button>
          ) : null}
        </div>
      </div>

      <DetailBlock title={t("detail.payment")}>
        <DetailRow
          label={t("detail.created")}
          value={formatDateTime(reservation.payment.createdAt)}
        />
        <DetailRow label={t("detail.paidAt")} value={formatDateTime(reservation.payment.paidAt)} />
        <DetailRow
          label={t("detail.refundAmount")}
          value={
            reservation.payment.refundAmount != null
              ? formatCurrency(
                  reservation.payment.refundAmount,
                  reservation.payment.currency
                )
              : "-"
          }
        />
        <DetailRow
          label={t("detail.refundedAt")}
          value={formatDateTime(reservation.payment.refundedAt)}
        />
        <DetailRow
          label={t("detail.refundReason")}
          value={reservation.payment.refundReason ?? "-"}
        />
        <DetailRow
          label={t("detail.studentConfirmationEmail")}
          value={
            reservation.payment.studentConfirmationEmailSentAt
              ? formatDateTime(reservation.payment.studentConfirmationEmailSentAt)
              : t("states.notSent")
          }
        />
        <DetailRow
          label={t("detail.mentorBookingEmail")}
          value={
            reservation.payment.mentorBookingEmailSentAt
              ? formatDateTime(reservation.payment.mentorBookingEmailSentAt)
              : t("states.notSent")
          }
        />
      </DetailBlock>

      <DetailBlock title={t("detail.reservation")}>
        <DetailRow label={t("detail.status")} value={humanizeToken(reservation.status)} />
        <DetailRow label={t("detail.lessonTime")} value={formatDateTime(reservation.startTime)} />
        <DetailRow
          label={t("detail.meetingStatus")}
          value={reservation.hasMeetingLink ? t("states.ready") : t("states.notReady")}
        />
        <DetailRow
          label={t("detail.meetingProvider")}
          value={
            reservation.meetingProvider
              ? humanizeToken(reservation.meetingProvider)
              : "-"
          }
        />
        <DetailRow
          label={t("detail.meetingJoinUrl")}
          value={<ExternalLinkValue url={reservation.meetingJoinUrl} />}
        />
        <DetailRow
          label={t("detail.meetingHostUrl")}
          value={<ExternalLinkValue url={reservation.meetingHostUrl} />}
        />
      </DetailBlock>

      <MeetingSetupIssueDetail reservation={reservation} />

      <MeetingLinkEditor
        reservation={reservation}
        processingKey={processingKey}
        onSaveMeetingLinks={onSaveMeetingLinks}
        onReissueMeetingLinks={onReissueMeetingLinks}
      />

      <DetailBlock title={t("detail.caseFlags")}>
        {reservation.flags.length > 0 ? (
          <div className="flex flex-wrap gap-2">{renderFlagBadges(reservation.flags)}</div>
        ) : (
          <p className="text-sm text-[#606579]">{t("empty.noCaseFlags")}</p>
        )}
      </DetailBlock>

      <DetailBlock title={t("detail.changeRequests")}>
        {reservation.changeRequests.length > 0 ? (
          <div className="space-y-3">
            {reservation.changeRequests.map((request) => (
              <ChangeRequestCard
                key={request.id}
                request={request}
                onApprove={
                  onApproveRequest
                    ? (currentRequest) =>
                        onApproveRequest(reservation, currentRequest)
                    : undefined
                }
                processing={processingKey === `approve_request:${request.id}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#606579]">{t("empty.noCancellationRequests")}</p>
        )}
      </DetailBlock>
    </div>
  );
}

function ActionRequiredQueue({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1f1f2d]">
            {title} ({count})
          </h3>
          <p className="mt-1 text-sm text-[#606579]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionRequiredCard({
  reservation,
  title,
  secondary,
  body,
  badges,
  selected,
  processing,
  actionLabel,
  onSelect,
  onAction,
}: {
  reservation: AdminReservationCase;
  title: string;
  secondary: string;
  body: ReactNode;
  badges?: ReactNode;
  selected: boolean;
  processing: boolean;
  actionLabel: string;
  onSelect: () => void;
  onAction: () => void;
}) {
  const t = useTranslations("admin.operations");

  return (
    <QueueCard selected={selected} onSelect={onSelect}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1f1f2d]">{title}</p>
          <p className="mt-1 text-sm text-[#606579]">{secondary}</p>
          <p className="mt-1 text-xs text-[#606579]">
            {t("labels.lessonAt", {
              dateTime: formatDateTime(reservation.startTime),
            })}
          </p>
        </div>
        <Badge
          label={humanizeToken(reservation.status)}
          tone={bookingStatusTone(reservation.status)}
        />
      </div>
      <div className="mt-3 text-sm text-[#1f1f2d]">{body}</div>
      {badges ? <div className="mt-3 flex flex-wrap gap-2">{badges}</div> : null}
      <div className="mt-4">
        <button
          type="button"
          disabled={processing}
          onClick={(event) => {
            event.stopPropagation();
            onAction();
          }}
          className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? t("actions.processing") : actionLabel}
        </button>
      </div>
    </QueueCard>
  );
}

function PaymentList({
  reservations,
  selectedId,
  processingKey,
  onSelect,
  onCompleteBooking,
  onApprovePayout,
}: {
  reservations: PaymentReservationCase[];
  selectedId: string | null;
  processingKey: string | null;
  onSelect: (id: string) => void;
  onCompleteBooking: (reservation: PaymentReservationCase) => void;
  onApprovePayout: (reservation: PaymentReservationCase) => void;
}) {
  const t = useTranslations("admin.operations");

  if (reservations.length === 0) {
    return (
      <EmptyState
        title={t("empty.noPaymentRecordsTitle")}
        description={t("empty.noPaymentRecordsDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => {
        const payoutProcessing = processingKey === `payout:${reservation.payment.id}`;
        const completeProcessing = processingKey === `complete:${reservation.bookingId}`;

        return (
          <QueueCard
            key={reservation.id}
            selected={selectedId === reservation.id}
            onSelect={() => onSelect(reservation.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1f1f2d]">
                  {t("labels.bookingNumber", { id: reservation.bookingId })}
                </p>
                <p className="mt-1 text-sm text-[#606579]">
                  {formatCurrency(
                    reservation.payment.amount,
                    reservation.payment.currency
                  )}
                </p>
                <p className="mt-1 text-xs text-[#606579]">
                  {reservation.student.displayName} x{" "}
                  {reservation.mentor?.displayName ?? t("states.unknownMentor")}
                </p>
                <p className="mt-1 text-xs text-[#606579]">
                  {formatDateTime(reservation.startTime)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  label={humanizeToken(reservation.payment.status)}
                  tone={paymentStatusTone(reservation.payment.status)}
                />
                {reservation.payout ? (
                  <Badge
                    label={t("labels.payoutStatusBadge", {
                      status: humanizeToken(reservation.payout.status),
                    })}
                    tone={payoutStatusTone(reservation.payout.status)}
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {renderFlagBadges(reservation.flags)}
            </div>
            {reservation.lessonCompletionEligible ||
            reservation.paymentApprovalEligible ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {reservation.lessonCompletionEligible ? (
                  <button
                    type="button"
                    disabled={completeProcessing}
                    onClick={(event) => {
                      event.stopPropagation();
                      onCompleteBooking(reservation);
                    }}
                    className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {completeProcessing
                      ? t("actions.completingLesson")
                      : t("actions.completeLesson")}
                  </button>
                ) : null}
                {reservation.paymentApprovalEligible ? (
                  <button
                    type="button"
                    disabled={payoutProcessing}
                    onClick={(event) => {
                      event.stopPropagation();
                      onApprovePayout(reservation);
                    }}
                    className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payoutProcessing
                      ? t("actions.approvingPayout")
                      : t("actions.approvePayout")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </QueueCard>
        );
      })}
    </div>
  );
}

function LogList({
  reservations,
  selectedId,
  onSelect,
}: {
  reservations: AdminReservationCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("admin.operations");

  if (reservations.length === 0) {
    return (
      <EmptyState
        title={t("empty.noProcessedLogsTitle")}
        description={t("empty.noProcessedLogsDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <QueueCard
          key={reservation.id}
          selected={selectedId === reservation.id}
          onSelect={() => onSelect(reservation.id)}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                {t("labels.bookingNumber", { id: reservation.bookingId })}
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                {reservation.student.displayName} x{" "}
                {reservation.mentor?.displayName ?? t("states.unknownMentor")}
              </p>
              <p className="mt-1 text-xs text-[#606579]">
                {t("labels.lessonAt", {
                  dateTime: formatDateTime(reservation.startTime),
                })}
              </p>
              <p className="mt-1 text-xs text-[#606579]">
                {t("labels.activityAt", {
                  dateTime: formatTimestamp(getCaseActivityTimestamp(reservation)),
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                label={humanizeToken(reservation.status)}
                tone={bookingStatusTone(reservation.status)}
              />
              {reservation.payment ? (
                <Badge
                  label={t("labels.paymentStatusBadge", {
                    status: humanizeToken(reservation.payment.status),
                  })}
                  tone={paymentStatusTone(reservation.payment.status)}
                />
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {renderFlagBadges(reservation.flags)}
          </div>
        </QueueCard>
      ))}
    </div>
  );
}

function SupportList({
  requests,
  selectedId,
  onSelect,
}: {
  requests: AdminSupportRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("admin.operations");
  const ts = useTranslations("support");

  if (requests.length === 0) {
    return (
      <EmptyState
        title={t("support.empty.noRequestsTitle")}
        description={t("support.empty.noRequestsDescription")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const failedReplies = request.replies.filter(
          (reply) => reply.deliveryStatus === "failed"
        ).length;

        return (
          <QueueCard
            key={request.id}
            selected={selectedId === request.id}
            onSelect={() => onSelect(request.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1f1f2d]">
                  {request.name}
                </p>
                <p className="mt-1 text-sm text-[#606579]">{request.email}</p>
                <p className="mt-1 text-xs text-[#606579]">
                  {ts(`categories.${request.category}.label`)} ·{" "}
                  {formatDateTime(request.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  label={t(`support.filters.${request.status}`)}
                  tone={supportStatusTone(request.status)}
                />
                {failedReplies > 0 ? (
                  <Badge
                    label={t("support.failedRepliesBadge", {
                      count: failedReplies,
                    })}
                    tone="danger"
                  />
                ) : null}
              </div>
            </div>
            {request.context ? (
              <p className="mt-3 text-xs text-[#606579]">{request.context}</p>
            ) : null}
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#1f1f2d]">
              {request.message}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                label={t("support.replyCountBadge", {
                  count: request.replies.length,
                })}
                tone="info"
              />
            </div>
          </QueueCard>
        );
      })}
    </div>
  );
}

function SupportRequestDetail({
  request,
  processingKey,
  onReply,
}: {
  request: AdminSupportRequest | null;
  processingKey?: string | null;
  onReply: (
    request: AdminSupportRequest,
    values: { subject: string; message: string }
  ) => void;
}) {
  const t = useTranslations("admin.operations");
  const ts = useTranslations("support");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const defaultReplySubject = request
    ? t("support.reply.defaultSubject", {
        topic: ts(`categories.${request.category}.label`),
      })
    : "";

  useEffect(() => {
    if (!request) {
      setSubject("");
      setMessage("");
      setLocalError(null);
      return;
    }

    setSubject(defaultReplySubject);
    setMessage("");
    setLocalError(null);
  }, [defaultReplySubject, request]);

  if (!request) {
    return (
      <EmptyState
        title={t("support.empty.selectTitle")}
        description={t("support.empty.selectDescription")}
      />
    );
  }

  const replyProcessing = processingKey === `support_reply:${request.id}`;

  return (
    <div className="space-y-4">
      <DetailBlock title={t("support.detail.request")}>
        <DetailRow
          label={t("detail.status")}
          value={t(`support.filters.${request.status}`)}
        />
        <DetailRow
          label={t("support.detail.topic")}
          value={ts(`categories.${request.category}.label`)}
        />
        <DetailRow label={t("detail.name")} value={request.name} />
        <DetailRow label={t("detail.email")} value={request.email} />
        <DetailRow
          label={t("support.detail.requestId")}
          value={
            <span className="break-all text-right font-mono text-xs">
              {request.id}
            </span>
          }
        />
        <DetailRow
          label={t("detail.created")}
          value={formatDateTime(request.createdAt)}
        />
        <DetailRow
          label={t("support.detail.lastReply")}
          value={
            request.lastRepliedAt
              ? `${formatDateTime(request.lastRepliedAt)}${
                  request.lastRepliedByDisplayName
                    ? ` · ${request.lastRepliedByDisplayName}`
                    : ""
                }`
              : "-"
          }
        />
        <DetailRow
          label={t("support.detail.locale")}
          value={request.locale ?? "-"}
        />
        {request.context ? (
          <DetailRow
            label={t("support.detail.context")}
            value={request.context}
          />
        ) : null}
      </DetailBlock>

      <DetailBlock title={t("support.detail.originalMessage")}>
        <p className="whitespace-pre-wrap text-sm leading-7 text-[#1f1f2d]">
          {request.message}
        </p>
      </DetailBlock>

      <DetailBlock title={t("support.detail.replyHistory")}>
        {request.replies.length === 0 ? (
          <p className="text-sm text-[#606579]">{t("support.empty.noReplies")}</p>
        ) : (
          <div className="space-y-3">
            {request.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1f1f2d]">
                      {reply.subject}
                    </p>
                    <p className="mt-1 text-xs text-[#606579]">
                      {reply.senderDisplayName} · {formatDateTime(reply.createdAt)}
                    </p>
                  </div>
                  <Badge
                    label={humanizeToken(reply.deliveryStatus)}
                    tone={deliveryStatusTone(reply.deliveryStatus)}
                  />
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#1f1f2d]">
                  {reply.body}
                </p>
                {reply.deliveryError ? (
                  <p className="mt-3 text-xs text-[#c32a68]">
                    {t("support.detail.deliveryError", {
                      message: reply.deliveryError,
                    })}
                  </p>
                ) : null}
                {reply.sentAt ? (
                  <p className="mt-2 text-xs text-[#606579]">
                    {t("support.detail.sentAt", {
                      dateTime: formatDateTime(reply.sentAt),
                    })}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </DetailBlock>

      <DetailBlock title={t("support.reply.title")}>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#1f1f2d]">
              {t("support.reply.subject")}
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d5d7df] bg-white px-3 py-2 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#1f1f2d]">
              {t("support.reply.message")}
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-xl border border-[#d5d7df] bg-white px-3 py-2 text-sm leading-7 text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>

          {localError ? (
            <p className="text-sm text-[#c32a68]">{localError}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={replyProcessing}
              onClick={() => {
                if (!subject.trim()) {
                  setLocalError(t("support.reply.errors.subjectRequired"));
                  return;
                }

                if (!message.trim()) {
                  setLocalError(t("support.reply.errors.messageRequired"));
                  return;
                }

                setLocalError(null);
                onReply(request, {
                  subject: subject.trim(),
                  message: message.trim(),
                });
              }}
              className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {replyProcessing
                ? t("support.reply.sending")
                : t("support.reply.submit")}
            </button>
            <p className="text-xs text-[#606579]">
              {t("support.reply.notice")}
            </p>
          </div>
        </div>
      </DetailBlock>
    </div>
  );
}

function OverviewPanel({
  summary,
  cancellationRequestItems,
  lessonCompletionItems,
  payoutApprovalItems,
  meetingSetupItems,
  confirmedReservationItems,
  openSupportCount,
  refundPendingCount,
  processedLogsCount,
  onOpenActionRequired,
  onOpenPayments,
  onOpenSupport,
  onOpenLogs,
}: {
  summary: AdminOperationsResponse["summary"];
  cancellationRequestItems: CancellationActionItem[];
  lessonCompletionItems: PaymentReservationCase[];
  payoutApprovalItems: PaymentReservationCase[];
  meetingSetupItems: MeetingSetupActionItem[];
  confirmedReservationItems: PaymentReservationCase[];
  openSupportCount: number;
  refundPendingCount: number;
  processedLogsCount: number;
  onOpenActionRequired: (focus: ActionRequiredFocus) => void;
  onOpenPayments: (filter: PaymentViewFilter) => void;
  onOpenSupport: (filter: SupportViewFilter) => void;
  onOpenLogs: () => void;
}) {
  const t = useTranslations("admin.operations");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#1f1f2d]">
            {t("overview.snapshotTitle")}
          </h2>
          <p className="mt-2 text-sm text-[#606579]">
            {t("overview.snapshotDescription")}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <SummaryCard
              label={t("overview.cancellationRequestsLabel")}
              value={cancellationRequestItems.length}
              description={t("overview.cancellationRequestsDescription")}
              tone="danger"
              onClick={() => onOpenActionRequired("cancellation_requests")}
            />
            <SummaryCard
              label={t("overview.lessonCompletionLabel")}
              value={lessonCompletionItems.length}
              description={t("overview.lessonCompletionDescription")}
              tone="warning"
              onClick={() => onOpenActionRequired("lesson_completion")}
            />
            <SummaryCard
              label={t("overview.payoutApprovalsLabel")}
              value={payoutApprovalItems.length}
              description={t("overview.payoutApprovalsDescription")}
              tone="warning"
              onClick={() => onOpenActionRequired("payout_approvals")}
            />
            <SummaryCard
              label={t("overview.meetingSetupIssuesLabel")}
              value={meetingSetupItems.length}
              description={t("overview.meetingSetupIssuesDescription")}
              tone="danger"
              onClick={() => onOpenActionRequired("meeting_setup_issues")}
            />
            <SummaryCard
              label={t("overview.confirmedLessonsLabel")}
              value={confirmedReservationItems.length}
              description={t("overview.confirmedLessonsDescription")}
              tone="info"
              onClick={() => onOpenPayments("confirmed")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#1f1f2d]">
                {t("overview.nextTitle")}
              </h3>
              <p className="mt-1 text-sm text-[#606579]">
                {t("overview.nextDescription")}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => onOpenPayments("refund_pending")}
              className="flex w-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#fcfcfd] px-4 py-3 text-left hover:border-[#cfd3e1]"
            >
              <div>
                <p className="text-sm font-semibold text-[#1f1f2d]">
                  {t("overview.refundPendingTitle")}
                </p>
                <p className="mt-1 text-xs text-[#606579]">
                  {t("overview.refundPendingDescription")}
                </p>
              </div>
              <Badge label={String(refundPendingCount)} tone="warning" />
            </button>

            <button
              type="button"
              onClick={onOpenLogs}
              className="flex w-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#fcfcfd] px-4 py-3 text-left hover:border-[#cfd3e1]"
            >
              <div>
                <p className="text-sm font-semibold text-[#1f1f2d]">
                  {t("overview.processedLogsTitle")}
                </p>
                <p className="mt-1 text-xs text-[#606579]">
                  {t("overview.processedLogsDescription")}
                </p>
              </div>
              <Badge label={String(processedLogsCount)} tone="neutral" />
            </button>

            <button
              type="button"
              onClick={() => onOpenSupport("open")}
              className="flex w-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#fcfcfd] px-4 py-3 text-left hover:border-[#cfd3e1]"
            >
              <div>
                <p className="text-sm font-semibold text-[#1f1f2d]">
                  {t("overview.supportRequestsTitle")}
                </p>
                <p className="mt-1 text-xs text-[#606579]">
                  {t("overview.supportRequestsDescription")}
                </p>
              </div>
              <Badge label={String(openSupportCount)} tone="warning" />
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <SummaryCard
          label={t("overview.usersNeedAttentionLabel")}
          value={summary.usersNeedingAttention}
          description={t("overview.usersNeedAttentionDescription")}
          tone="warning"
        />
        <SummaryCard
          label={t("overview.mentorsNeedAttentionLabel")}
          value={summary.mentorsNeedingAttention}
          description={t("overview.mentorsNeedAttentionDescription")}
          tone="warning"
        />
        <SummaryCard
          label={t("overview.paymentFailuresLabel")}
          value={summary.paymentFailures}
          description={t("overview.paymentFailuresDescription")}
          tone="danger"
        />
        <SummaryCard
          label={t("overview.expiredReservationsLabel")}
          value={summary.expiredReservations}
          description={t("overview.expiredReservationsDescription")}
          tone="warning"
        />
      </div>
    </div>
  );
}

export function AdminOperationsConsole({
  defaultTab = "overview",
}: {
  defaultTab?: AdminTab;
}) {
  const router = useRouter();
  const t = useTranslations("admin.operations");
  const [data, setData] = useState<AdminOperationsResponse | null>(null);
  const [supportData, setSupportData] =
    useState<AdminSupportRequestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [actionRequiredFocus, setActionRequiredFocus] =
    useState<ActionRequiredFocus>("all");
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentViewFilter>("action_required");
  const [supportFilter, setSupportFilter] = useState<SupportViewFilter>("open");
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [selectedActionReservationId, setSelectedActionReservationId] = useState<
    string | null
  >(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedSupportRequestId, setSelectedSupportRequestId] = useState<
    string | null
  >(null);
  const [selectedLogReservationId, setSelectedLogReservationId] = useState<
    string | null
  >(null);

  async function fetchDashboard() {
    try {
      setError(null);
      const [response, supportResponse] = await Promise.all([
        fetch("/api/admin/operations", {
          cache: "no-store",
        }),
        fetch("/api/admin/support/requests", {
          cache: "no-store",
        }),
      ]);

      if (
        response.status === 401 ||
        response.status === 403 ||
        supportResponse.status === 401 ||
        supportResponse.status === 403
      ) {
        router.push("/");
        return;
      }

      if (!response.ok || !supportResponse.ok) {
        throw new Error(t("errors.fetch"));
      }

      const [payload, supportPayload] = (await Promise.all([
        response.json(),
        supportResponse.json(),
      ])) as [AdminOperationsResponse, AdminSupportRequestsResponse];
      setData(payload);
      setSupportData(supportPayload);
    } catch {
      setError(t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reservations = useMemo(
    () => data?.reservations ?? [],
    [data?.reservations]
  );
  const supportRequests = useMemo(
    () => supportData?.requests ?? [],
    [supportData?.requests]
  );
  const paymentCases = useMemo(
    () => reservations.filter(isPaymentReservationCase),
    [reservations]
  );

  const confirmedReservationItems = useMemo(() => {
    return paymentCases
      .filter((reservation) => isConfirmedReservation(reservation))
      .sort(
        (left, right) =>
          getTimestamp(left.startTime) - getTimestamp(right.startTime)
      );
  }, [paymentCases]);

  const cancellationRequestItems = useMemo(() => {
    return reservations
      .flatMap((reservation) =>
        reservation.changeRequests
          .filter((request) => request.status === "pending")
          .map((request) => ({ reservation, request }))
      )
      .sort(
        (left, right) =>
          getTimestamp(right.request.createdAt) -
          getTimestamp(left.request.createdAt)
      );
  }, [reservations]);

  const payoutApprovalItems = useMemo(() => {
    return paymentCases
      .filter((reservation) => reservation.paymentApprovalEligible)
      .sort(
        (left, right) =>
          getTimestamp(right.payment.paidAt ?? right.payment.createdAt) -
          getTimestamp(left.payment.paidAt ?? left.payment.createdAt)
      );
  }, [paymentCases]);

  const lessonCompletionItems = useMemo(() => {
    return paymentCases
      .filter((reservation) => reservation.lessonCompletionEligible)
      .sort(
        (left, right) =>
          getTimestamp(right.endTime) - getTimestamp(left.endTime)
      );
  }, [paymentCases]);

  const meetingSetupItems = useMemo(() => {
    return reservations
      .filter(
        (
          reservation
        ): reservation is AdminReservationCase & {
          meetingSetupIssue: NonNullable<AdminReservationCase["meetingSetupIssue"]>;
        } => hasMeetingSetupIssue(reservation)
      )
      .map((reservation) => ({
        reservation,
        issue: reservation.meetingSetupIssue,
      }))
      .sort(
        (left, right) =>
          getTimestamp(right.issue.occurredAt) - getTimestamp(left.issue.occurredAt)
      );
  }, [reservations]);

  const refundPendingItems = useMemo(() => {
    return paymentCases.filter((reservation) => hasRefundPending(reservation));
  }, [paymentCases]);

  const filteredPayments = useMemo(() => {
    const base =
      paymentFilter === "all"
        ? paymentCases
        : paymentFilter === "cancellation_pending"
          ? paymentCases.filter((reservation) =>
              hasPendingCancellationRequest(reservation)
            )
          : paymentFilter === "confirmed"
            ? confirmedReservationItems
          : paymentFilter === "completion_due"
            ? paymentCases.filter((reservation) =>
                hasLessonCompletionDue(reservation)
              )
          : paymentFilter === "payout_pending"
            ? paymentCases.filter((reservation) => hasPayoutPending(reservation))
            : paymentFilter === "refund_pending"
              ? refundPendingItems
              : paymentCases.filter((reservation) =>
                  isActionRequiredReservation(reservation)
                );

    if (!query) {
      return base;
    }

    return base.filter((reservation) =>
      searchMatches(buildPaymentSearchHaystack(reservation), query)
    );
  }, [
    confirmedReservationItems,
    paymentCases,
    paymentFilter,
    query,
    refundPendingItems,
  ]);

  const filteredLogs = useMemo(() => {
    const base = reservations
      .filter((reservation) => isLogReservation(reservation))
      .sort(
        (left, right) =>
          getCaseActivityTimestamp(right) - getCaseActivityTimestamp(left)
      );

    if (!query) {
      return base;
    }

    return base.filter((reservation) =>
      searchMatches(buildReservationSearchHaystack(reservation), query)
    );
  }, [query, reservations]);

  const filteredSupportRequests = useMemo(() => {
    const base =
      supportFilter === "all"
        ? supportRequests
        : supportRequests.filter((request) => request.status === supportFilter);

    if (!query) {
      return base;
    }

    return base.filter((request) =>
      searchMatches(buildSupportRequestSearchHaystack(request), query)
    );
  }, [query, supportFilter, supportRequests]);

  const visibleCancellationItems = useMemo(() => {
    if (!query) {
      return cancellationRequestItems;
    }

    return cancellationRequestItems.filter(({ reservation, request }) =>
      searchMatches(
        [
          buildReservationSearchHaystack(reservation),
          request.reason,
          request.requesterDisplayName,
        ]
          .filter(Boolean)
          .join(" "),
        query
      )
    );
  }, [cancellationRequestItems, query]);

  const visiblePayoutItems = useMemo(() => {
    if (!query) {
      return payoutApprovalItems;
    }

    return payoutApprovalItems.filter((reservation) =>
      searchMatches(buildPaymentSearchHaystack(reservation), query)
    );
  }, [payoutApprovalItems, query]);

  const visibleLessonCompletionItems = useMemo(() => {
    if (!query) {
      return lessonCompletionItems;
    }

    return lessonCompletionItems.filter((reservation) =>
      searchMatches(buildPaymentSearchHaystack(reservation), query)
    );
  }, [lessonCompletionItems, query]);

  const visibleMeetingSetupItems = useMemo(() => {
    if (!query) {
      return meetingSetupItems;
    }

    return meetingSetupItems.filter(({ reservation, issue }) =>
      searchMatches(
        [
          buildReservationSearchHaystack(reservation),
          issue.provider,
          issue.errorSummary,
        ]
          .filter(Boolean)
          .join(" "),
        query
      )
    );
  }, [meetingSetupItems, query]);

  const visibleActionRequiredReservations = useMemo(() => {
    const pool =
      actionRequiredFocus === "cancellation_requests"
        ? visibleCancellationItems.map((item) => item.reservation)
        : actionRequiredFocus === "lesson_completion"
          ? visibleLessonCompletionItems
        : actionRequiredFocus === "payout_approvals"
          ? visiblePayoutItems
          : actionRequiredFocus === "meeting_setup_issues"
            ? visibleMeetingSetupItems.map((item) => item.reservation)
          : [
              ...visibleCancellationItems.map((item) => item.reservation),
              ...visibleLessonCompletionItems,
              ...visiblePayoutItems,
              ...visibleMeetingSetupItems.map((item) => item.reservation),
            ];

    return [...new Map(pool.map((reservation) => [reservation.id, reservation])).values()];
  }, [
    actionRequiredFocus,
    visibleCancellationItems,
    visibleLessonCompletionItems,
    visibleMeetingSetupItems,
    visiblePayoutItems,
  ]);

  const selectedActionReservation = pickSelectedItem(
    visibleActionRequiredReservations,
    selectedActionReservationId
  );
  const selectedPayment = pickSelectedItem(filteredPayments, selectedPaymentId);
  const selectedSupportRequest = pickSelectedItem(
    filteredSupportRequests,
    selectedSupportRequestId
  );
  const selectedLogReservation = pickSelectedItem(
    filteredLogs,
    selectedLogReservationId
  );

  async function handleCompleteBooking(reservation: PaymentReservationCase) {
    const key = `complete:${reservation.bookingId}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/reservations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          bookingId: reservation.bookingId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.completeLessonFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.completeLessonFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleApprovePayout(reservation: PaymentReservationCase) {
    const key = `payout:${reservation.payment.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/stripe/payouts/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: reservation.payment.id }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.approvePayoutFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.approvePayoutFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleApproveCancellation(
    reservation: AdminReservationCase,
    request: AdminBookingChangeRequest
  ) {
    const key = `approve_request:${request.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/reservations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_request",
          requestId: request.id,
          note: null,
          refundOnCancel: reservation.payment?.status === "succeeded",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.approveCancellationFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.approveCancellationFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleRefundPayment(reservation: PaymentReservationCase) {
    if (!window.confirm(t("alerts.refundConfirm"))) {
      return;
    }

    const key = `refund:${reservation.payment.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/reservations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          paymentId: reservation.payment.id,
          note: null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.refundFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.refundFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleSaveMeetingLinks(
    reservation: AdminReservationCase,
    values: {
      meetingProvider: string;
      meetingJoinUrl: string;
      meetingHostUrl: string | null;
    }
  ) {
    const key = `meeting:${reservation.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/reservations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_meeting_links",
          bookingId: reservation.bookingId,
          meetingProvider: values.meetingProvider,
          meetingJoinUrl: values.meetingJoinUrl,
          meetingHostUrl: values.meetingHostUrl,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.saveMeetingLinkFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.saveMeetingLinkFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleReissueMeetingLinks(reservation: AdminReservationCase) {
    const key = `meeting_reissue:${reservation.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/reservations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reissue_meeting_links",
          bookingId: reservation.bookingId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("alerts.reissueMeetingLinkFailed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("alerts.reissueMeetingLinkFailed"));
    } finally {
      setProcessingKey(null);
    }
  }

  async function handleReplySupportRequest(
    request: AdminSupportRequest,
    values: { subject: string; message: string }
  ) {
    const key = `support_reply:${request.id}`;
    setProcessingKey(key);

    try {
      const response = await fetch("/api/admin/support/requests/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          requestId: request.id,
          subject: values.subject,
          message: values.message,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || t("support.reply.failed"));
        return;
      }

      await fetchDashboard();
    } catch {
      window.alert(t("support.reply.failed"));
    } finally {
      setProcessingKey(null);
    }
  }

  function openActionRequired(focus: ActionRequiredFocus) {
    setActiveTab("action_required");
    setActionRequiredFocus(focus);
    setQuery("");
  }

  function openPayments(filter: PaymentViewFilter) {
    setActiveTab("payments");
    setPaymentFilter(filter);
    setQuery("");
  }

  function openSupport(filter: SupportViewFilter) {
    setActiveTab("support");
    setSupportFilter(filter);
    setQuery("");
  }

  function openReservationDetail(reservationId: string) {
    setSelectedActionReservationId(reservationId);

    window.requestAnimationFrame(() => {
      document
        .getElementById("admin-detail-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const activeCount =
    activeTab === "action_required"
      ? actionRequiredFocus === "cancellation_requests"
        ? visibleCancellationItems.length
        : actionRequiredFocus === "lesson_completion"
          ? visibleLessonCompletionItems.length
        : actionRequiredFocus === "payout_approvals"
          ? visiblePayoutItems.length
          : actionRequiredFocus === "meeting_setup_issues"
            ? visibleMeetingSetupItems.length
            : visibleActionRequiredReservations.length
      : activeTab === "payments"
        ? filteredPayments.length
        : activeTab === "support"
          ? filteredSupportRequests.length
        : activeTab === "logs"
          ? filteredLogs.length
          : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] px-6 py-8">
        <p className="text-sm text-[#606579]">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafb] px-6 py-8">
        <p className="text-sm text-[#c32a68]">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <header className="border-b border-[#e3e4ea] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#606579]">{t("header.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#1f1f2d]">
              {t("header.title")}
            </h1>
            <p className="mt-2 text-sm text-[#606579]">
              {t("header.description", {
                updatedAt: formatDateTime(data?.updatedAt),
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchDashboard()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f1f2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#11111b]"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("header.refresh")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <section className="rounded-[28px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[#c2410c]">
                {t("hero.eyebrow")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1f1f2d]">
                {t("hero.title")}
              </h2>
              <p className="mt-2 text-sm text-[#606579]">
                {t("hero.description")}
              </p>
            </div>
            <p className="text-sm text-[#606579]">
              {t("hero.summary", {
                refundCount: refundPendingItems.length,
                logCount: reservations.filter((reservation) => isLogReservation(reservation))
                  .length,
              })}
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <SummaryCard
              label={t("overview.cancellationRequestsLabel")}
              value={cancellationRequestItems.length}
              description={t("hero.cancellationDescription")}
              tone="danger"
              onClick={() => openActionRequired("cancellation_requests")}
            />
            <SummaryCard
              label={t("overview.lessonCompletionLabel")}
              value={lessonCompletionItems.length}
              description={t("hero.lessonCompletionDescription")}
              tone="warning"
              onClick={() => openActionRequired("lesson_completion")}
            />
            <SummaryCard
              label={t("overview.payoutApprovalsLabel")}
              value={payoutApprovalItems.length}
              description={t("hero.payoutDescription")}
              tone="warning"
              onClick={() => openActionRequired("payout_approvals")}
            />
            <SummaryCard
              label={t("overview.meetingSetupIssuesLabel")}
              value={meetingSetupItems.length}
              description={t("hero.meetingSetupDescription")}
              tone="danger"
              onClick={() => openActionRequired("meeting_setup_issues")}
            />
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-4 py-4 lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {TAB_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setActiveTab(option)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      activeTab === option
                        ? "bg-[#1f1f2d] text-white"
                        : "bg-[#f3f4f6] text-[#606579] hover:bg-[#e5e7eb]"
                    )}
                  >
                    {t(`tabs.${option}`)}
                  </button>
                ))}
              </div>

              {activeTab !== "overview" ? (
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a2]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("search.placeholder", {
                      label: t(`tabs.${activeTab}`),
                    })}
                    className="w-full rounded-xl border border-[#d5d7df] bg-white py-2 pl-9 pr-3 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d] sm:w-72"
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {activeTab === "overview" ? (
              <OverviewPanel
                summary={data?.summary ?? {
                  totalReservations: 0,
                  reservationsNeedingAttention: 0,
                  awaitingPayoutApproval: 0,
                  meetingSetupIssues: 0,
                  expiredReservations: 0,
                  usersNeedingAttention: 0,
                  mentorsNeedingAttention: 0,
                  paymentFailures: 0,
                }}
                cancellationRequestItems={cancellationRequestItems}
                lessonCompletionItems={lessonCompletionItems}
                payoutApprovalItems={payoutApprovalItems}
                meetingSetupItems={meetingSetupItems}
                confirmedReservationItems={confirmedReservationItems}
                openSupportCount={supportData?.summary.open ?? 0}
                refundPendingCount={refundPendingItems.length}
                processedLogsCount={
                  reservations.filter((reservation) => isLogReservation(reservation))
                    .length
                }
                onOpenActionRequired={openActionRequired}
                onOpenPayments={openPayments}
                onOpenSupport={openSupport}
                onOpenLogs={() => setActiveTab("logs")}
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                <div>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1f1f2d]">
                        {activeTab === "action_required"
                          ? t("listHeadings.actionQueue")
                          : activeTab === "payments"
                            ? t("tabs.payments")
                            : t("tabs.logs")}
                      </h2>
                      <p className="mt-1 text-sm text-[#606579]">
                        {t("results", { count: activeCount })}
                      </p>
                    </div>

                    {activeTab === "action_required" ? (
                      <div className="flex flex-wrap gap-2">
                        {ACTION_REQUIRED_FILTERS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setActionRequiredFocus(option)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm font-medium transition",
                              actionRequiredFocus === option
                                ? "bg-[#1f1f2d] text-white"
                                : "bg-[#f3f4f6] text-[#606579] hover:bg-[#e5e7eb]"
                            )}
                          >
                            {t(`filters.actionRequired.${option}`)}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {activeTab === "payments" ? (
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_FILTERS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPaymentFilter(option)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm font-medium transition",
                              paymentFilter === option
                                ? "bg-[#1f1f2d] text-white"
                                : "bg-[#f3f4f6] text-[#606579] hover:bg-[#e5e7eb]"
                            )}
                          >
                            {t(`filters.payments.${option}`)}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {activeTab === "support" ? (
                      <div className="flex flex-wrap gap-2">
                        {SUPPORT_FILTERS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSupportFilter(option)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm font-medium transition",
                              supportFilter === option
                                ? "bg-[#1f1f2d] text-white"
                                : "bg-[#f3f4f6] text-[#606579] hover:bg-[#e5e7eb]"
                            )}
                          >
                            {t(`support.filters.${option}`)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="max-h-[760px] space-y-6 overflow-y-auto pr-1">
                    {activeTab === "action_required" ? (
                      <>
                        {actionRequiredFocus !== "payout_approvals" &&
                        actionRequiredFocus !== "meeting_setup_issues" ? (
                          <ActionRequiredQueue
                            title={t("queues.cancellationTitle")}
                            count={visibleCancellationItems.length}
                            description={t("queues.cancellationDescription")}
                          >
                            {visibleCancellationItems.length > 0 ? (
                              <div className="space-y-3">
                                {visibleCancellationItems.map(({ reservation, request }) => (
                                  <ActionRequiredCard
                                    key={request.id}
                                    reservation={reservation}
                                    title={t("labels.bookingNumber", {
                                      id: reservation.bookingId,
                                    })}
                                    secondary={reservation.student.displayName}
                                    body={
                                      request.reason ? (
                                        <p className="text-[#1f1f2d]">
                                          {request.reason}
                                        </p>
                                      ) : (
                                        <p className="text-[#606579]">
                                          {t("states.noCancellationReason")}
                                        </p>
                                      )
                                    }
                                    badges={renderFlagBadges(reservation.flags)}
                                    selected={
                                      selectedActionReservation?.id === reservation.id
                                    }
                                    processing={
                                      processingKey === `approve_request:${request.id}`
                                    }
                                    actionLabel={t("actions.approveCancellation")}
                                    onSelect={() =>
                                      setSelectedActionReservationId(reservation.id)
                                    }
                                    onAction={() =>
                                      void handleApproveCancellation(
                                        reservation,
                                        request
                                      )
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <EmptyState
                                title={t("empty.noCancellationQueueTitle")}
                                description={t("empty.noCancellationQueueDescription")}
                              />
                            )}
                          </ActionRequiredQueue>
                        ) : null}

                        {actionRequiredFocus !== "cancellation_requests" &&
                        actionRequiredFocus !== "payout_approvals" &&
                        actionRequiredFocus !== "meeting_setup_issues" ? (
                          <ActionRequiredQueue
                            title={t("queues.lessonCompletionTitle")}
                            count={visibleLessonCompletionItems.length}
                            description={t("queues.lessonCompletionDescription")}
                          >
                            {visibleLessonCompletionItems.length > 0 ? (
                              <div className="space-y-3">
                                {visibleLessonCompletionItems.map((reservation) => (
                                  <ActionRequiredCard
                                    key={reservation.id}
                                    reservation={reservation}
                                    title={t("labels.bookingNumber", {
                                      id: reservation.bookingId,
                                    })}
                                    secondary={formatCurrency(
                                      reservation.payment.amount,
                                      reservation.payment.currency
                                    )}
                                    body={
                                      <p className="text-[#606579]">
                                        {reservation.student.displayName} x{" "}
                                        {reservation.mentor?.displayName ??
                                          t("states.unknownMentor")}{" "}
                                        · {formatDateTime(reservation.endTime)}
                                      </p>
                                    }
                                    badges={renderFlagBadges(reservation.flags)}
                                    selected={
                                      selectedActionReservation?.id === reservation.id
                                    }
                                    processing={
                                      processingKey ===
                                      `complete:${reservation.bookingId}`
                                    }
                                    actionLabel={t("actions.completeLesson")}
                                    onSelect={() =>
                                      setSelectedActionReservationId(reservation.id)
                                    }
                                    onAction={() =>
                                      void handleCompleteBooking(reservation)
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <EmptyState
                                title={t("empty.noLessonCompletionQueueTitle")}
                                description={t(
                                  "empty.noLessonCompletionQueueDescription"
                                )}
                              />
                            )}
                          </ActionRequiredQueue>
                        ) : null}

                        {actionRequiredFocus !== "cancellation_requests" &&
                        actionRequiredFocus !== "lesson_completion" &&
                        actionRequiredFocus !== "meeting_setup_issues" ? (
                          <ActionRequiredQueue
                            title={t("queues.payoutTitle")}
                            count={visiblePayoutItems.length}
                            description={t("queues.payoutDescription")}
                          >
                            {visiblePayoutItems.length > 0 ? (
                              <div className="space-y-3">
                                {visiblePayoutItems.map((reservation) => (
                                  <ActionRequiredCard
                                    key={reservation.id}
                                    reservation={reservation}
                                    title={t("labels.bookingNumber", {
                                      id: reservation.bookingId,
                                    })}
                                    secondary={formatCurrency(
                                      reservation.payment.amount,
                                      reservation.payment.currency
                                    )}
                                    body={
                                      <p className="text-[#606579]">
                                        {reservation.student.displayName} x{" "}
                                        {reservation.mentor?.displayName ??
                                          t("states.unknownMentor")}
                                      </p>
                                    }
                                    badges={renderFlagBadges(reservation.flags)}
                                    selected={
                                      selectedActionReservation?.id === reservation.id
                                    }
                                    processing={
                                      processingKey ===
                                      `payout:${reservation.payment.id}`
                                    }
                                    actionLabel={t("actions.approvePayout")}
                                    onSelect={() =>
                                      setSelectedActionReservationId(reservation.id)
                                    }
                                    onAction={() =>
                                      void handleApprovePayout(reservation)
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <EmptyState
                                title={t("empty.noPayoutQueueTitle")}
                                description={t("empty.noPayoutQueueDescription")}
                              />
                            )}
                          </ActionRequiredQueue>
                        ) : null}

                        {actionRequiredFocus !== "cancellation_requests" &&
                        actionRequiredFocus !== "lesson_completion" &&
                        actionRequiredFocus !== "payout_approvals" ? (
                          <ActionRequiredQueue
                            title={t("queues.meetingSetupTitle")}
                            count={visibleMeetingSetupItems.length}
                            description={t("queues.meetingSetupDescription")}
                          >
                            {visibleMeetingSetupItems.length > 0 ? (
                              <div className="space-y-3">
                                {visibleMeetingSetupItems.map(({ reservation, issue }) => (
                                  <ActionRequiredCard
                                    key={issue.id}
                                    reservation={reservation}
                                    title={t("labels.bookingNumber", {
                                      id: reservation.bookingId,
                                    })}
                                    secondary={`${reservation.student.displayName} x ${
                                      reservation.mentor?.displayName ??
                                      t("states.unknownMentor")
                                    }`}
                                    body={
                                      <div className="space-y-1 text-sm">
                                        <p className="text-[#1f1f2d]">
                                          {issue.errorSummary}
                                        </p>
                                        <p className="text-xs text-[#606579]">
                                          {issue.provider
                                            ? humanizeToken(issue.provider)
                                            : "-"}{" "}
                                          · {formatDateTime(issue.occurredAt)} ·{" "}
                                          {reservation.hasMeetingLink
                                            ? t("states.ready")
                                            : t("states.notReady")}
                                        </p>
                                      </div>
                                    }
                                    badges={renderFlagBadges(reservation.flags)}
                                    selected={
                                      selectedActionReservation?.id === reservation.id
                                    }
                                    processing={false}
                                    actionLabel={t("actions.openBookingDetail")}
                                    onSelect={() =>
                                      setSelectedActionReservationId(reservation.id)
                                    }
                                    onAction={() => openReservationDetail(reservation.id)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <EmptyState
                                title={t("empty.noMeetingSetupQueueTitle")}
                                description={t("empty.noMeetingSetupQueueDescription")}
                              />
                            )}
                          </ActionRequiredQueue>
                        ) : null}
                      </>
                    ) : null}

                    {activeTab === "payments" ? (
                      <PaymentList
                        reservations={filteredPayments}
                        selectedId={selectedPayment?.id ?? null}
                        processingKey={processingKey}
                        onSelect={setSelectedPaymentId}
                        onCompleteBooking={(reservation) =>
                          void handleCompleteBooking(reservation)
                        }
                        onApprovePayout={(reservation) =>
                          void handleApprovePayout(reservation)
                        }
                      />
                    ) : null}

                    {activeTab === "logs" ? (
                      <LogList
                        reservations={filteredLogs}
                        selectedId={selectedLogReservation?.id ?? null}
                        onSelect={setSelectedLogReservationId}
                      />
                    ) : null}

                    {activeTab === "support" ? (
                      <SupportList
                        requests={filteredSupportRequests}
                        selectedId={selectedSupportRequest?.id ?? null}
                        onSelect={setSelectedSupportRequestId}
                      />
                    ) : null}
                  </div>
                </div>

                <div id="admin-detail-panel">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[#1f1f2d]">
                      {t("listHeadings.detail")}
                    </h2>
                  </div>

                  {activeTab === "action_required" ? (
                    selectedActionReservation &&
                    isPaymentReservationCase(selectedActionReservation) &&
                    !hasPendingCancellationRequest(selectedActionReservation) ? (
                      <PaymentDetail
                        reservation={selectedActionReservation}
                        onCompleteBooking={(reservation) =>
                          void handleCompleteBooking(reservation)
                        }
                        onApprovePayout={(reservation) =>
                          void handleApprovePayout(reservation)
                        }
                        onRefundPayment={(reservation) =>
                          void handleRefundPayment(reservation)
                        }
                        onSaveMeetingLinks={(reservation, values) =>
                          void handleSaveMeetingLinks(reservation, values)
                        }
                        onReissueMeetingLinks={(reservation) =>
                          void handleReissueMeetingLinks(reservation)
                        }
                        processingKey={processingKey}
                      />
                    ) : (
                      <ReservationDetail
                        reservation={selectedActionReservation}
                        onApproveRequest={(reservation, request) =>
                          void handleApproveCancellation(reservation, request)
                        }
                        onSaveMeetingLinks={(reservation, values) =>
                          void handleSaveMeetingLinks(reservation, values)
                        }
                        onReissueMeetingLinks={(reservation) =>
                          void handleReissueMeetingLinks(reservation)
                        }
                        processingKey={processingKey}
                      />
                    )
                  ) : null}

                  {activeTab === "payments" ? (
                    <PaymentDetail
                      reservation={selectedPayment}
                      onCompleteBooking={(reservation) =>
                        void handleCompleteBooking(reservation)
                      }
                      onApprovePayout={(reservation) =>
                        void handleApprovePayout(reservation)
                      }
                      onRefundPayment={(reservation) =>
                        void handleRefundPayment(reservation)
                      }
                      onApproveRequest={(reservation, request) =>
                        void handleApproveCancellation(reservation, request)
                      }
                      onSaveMeetingLinks={(reservation, values) =>
                        void handleSaveMeetingLinks(reservation, values)
                      }
                      onReissueMeetingLinks={(reservation) =>
                        void handleReissueMeetingLinks(reservation)
                      }
                      processingKey={processingKey}
                    />
                  ) : null}

                  {activeTab === "logs" ? (
                    <ReservationDetail
                      reservation={selectedLogReservation}
                      onSaveMeetingLinks={(reservation, values) =>
                        void handleSaveMeetingLinks(reservation, values)
                      }
                      onReissueMeetingLinks={(reservation) =>
                        void handleReissueMeetingLinks(reservation)
                      }
                      processingKey={processingKey}
                    />
                  ) : null}

                  {activeTab === "support" ? (
                    <SupportRequestDetail
                      request={selectedSupportRequest}
                      processingKey={processingKey}
                      onReply={(request, values) =>
                        void handleReplySupportRequest(request, values)
                      }
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
