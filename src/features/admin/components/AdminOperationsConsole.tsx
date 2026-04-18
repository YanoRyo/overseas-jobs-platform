"use client";

import { Dialog } from "@headlessui/react";
import { RefreshCcw, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  AdminCaseFlag,
  AdminFlagTone,
  AdminMentorCase,
  AdminOperationsResponse,
  AdminReservationCase,
  AdminTab,
  AdminUserCase,
} from "../types";

type PaymentReservationCase = AdminReservationCase & {
  payment: NonNullable<AdminReservationCase["payment"]>;
};

type Tone = AdminFlagTone | "success" | "neutral";

const TAB_OPTIONS: Array<{ id: AdminTab; label: string }> = [
  { id: "reservations", label: "Reservations" },
  { id: "users", label: "Users" },
  { id: "mentors", label: "Mentors" },
  { id: "payments", label: "Payments" },
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isPaymentReservationCase(
  reservation: AdminReservationCase
): reservation is PaymentReservationCase {
  return reservation.payment !== null;
}

function parseAppDate(value: string | null | undefined) {
  if (!value) return null;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}Z`);
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

function formatDateOnly(value: string | null | undefined) {
  const date = parseAppDate(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function bookingStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "confirmed":
      return "info";
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

function paymentStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "succeeded":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

function payoutStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function humanizeToken(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function SummaryCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
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

function RecentReservationList({
  reservationIds,
  reservations,
  onOpenCase,
}: {
  reservationIds: number[];
  reservations: AdminReservationCase[];
  onOpenCase: (reservationId: string) => void;
}) {
  if (reservationIds.length === 0) {
    return (
      <p className="text-sm text-[#606579]">No linked reservation cases yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {reservationIds.map((bookingId) => {
        const reservation = reservations.find(
          (item) => item.bookingId === bookingId
        );

        if (!reservation) return null;

        return (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onOpenCase(reservation.id)}
            className="flex w-full items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-left hover:border-[#cfd3e1]"
          >
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                Booking #{reservation.bookingId}
              </p>
              <p className="mt-1 text-xs text-[#606579]">
                {reservation.student.displayName} x{" "}
                {reservation.mentor?.displayName ?? "Unknown mentor"}
              </p>
              <p className="mt-1 text-xs text-[#606579]">
                {formatDateTime(reservation.startTime)}
              </p>
            </div>
            <Badge
              label={humanizeToken(reservation.status)}
              tone={bookingStatusTone(reservation.status)}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReservationList({
  reservations,
  selectedId,
  onSelect,
}: {
  reservations: AdminReservationCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No reservation cases"
        description="No reservations match the current filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <button
          key={reservation.id}
          type="button"
          onClick={() => onSelect(reservation.id)}
          className={cn(
            "w-full rounded-2xl border px-4 py-4 text-left transition",
            selectedId === reservation.id
              ? "border-[#1f1f2d] bg-[#f8f8fb]"
              : "border-[#e5e7eb] bg-white hover:border-[#cfd3e1]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                Booking #{reservation.bookingId}
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                {reservation.student.displayName} x{" "}
                {reservation.mentor?.displayName ?? "Unknown mentor"}
              </p>
            </div>
            <Badge
              label={humanizeToken(reservation.status)}
              tone={bookingStatusTone(reservation.status)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {reservation.payment && (
              <Badge
                label={`Payment ${humanizeToken(reservation.payment.status)}`}
                tone={paymentStatusTone(reservation.payment.status)}
              />
            )}
            {reservation.flags.map((flag) => (
              <Badge key={flag.type} label={flag.label} tone={flag.tone} />
            ))}
          </div>
          <p className="mt-3 text-xs text-[#606579]">
            Lesson time: {formatDateTime(reservation.startTime)}
          </p>
        </button>
      ))}
    </div>
  );
}

function UserList({
  users,
  selectedId,
  onSelect,
}: {
  users: AdminUserCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="No user accounts match the current filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onSelect(user.id)}
          className={cn(
            "w-full rounded-2xl border px-4 py-4 text-left transition",
            selectedId === user.id
              ? "border-[#1f1f2d] bg-[#f8f8fb]"
              : "border-[#e5e7eb] bg-white hover:border-[#cfd3e1]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                {user.displayName}
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                @{user.username ?? "unknown"} {user.role ? `· ${user.role}` : ""}
              </p>
            </div>
            <Badge
              label={user.stateLabel}
              tone={user.needsAttention ? "warning" : "neutral"}
            />
          </div>
          <p className="mt-3 text-xs text-[#606579]">
            Reservations {user.counts.totalReservations} · Failed payments{" "}
            {user.counts.failedPayments} · Last lesson{" "}
            {formatDateOnly(user.lastReservationAt)}
          </p>
        </button>
      ))}
    </div>
  );
}

function MentorList({
  mentors,
  selectedId,
  onSelect,
}: {
  mentors: AdminMentorCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (mentors.length === 0) {
    return (
      <EmptyState
        title="No mentors found"
        description="No mentor profiles match the current filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <button
          key={mentor.id}
          type="button"
          onClick={() => onSelect(mentor.id)}
          className={cn(
            "w-full rounded-2xl border px-4 py-4 text-left transition",
            selectedId === mentor.id
              ? "border-[#1f1f2d] bg-[#f8f8fb]"
              : "border-[#e5e7eb] bg-white hover:border-[#cfd3e1]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                {mentor.displayName}
              </p>
              <p className="mt-1 text-sm text-[#606579]">{mentor.email}</p>
            </div>
            <Badge
              label={mentor.stateLabel}
              tone={mentor.needsAttention ? "warning" : "neutral"}
            />
          </div>
          <p className="mt-3 text-xs text-[#606579]">
            Awaiting payout approval {mentor.counts.awaitingPayoutApproval} ·
            Payout ready {mentor.stripeOnboardingCompleted ? "Yes" : "No"}
          </p>
        </button>
      ))}
    </div>
  );
}

function PaymentList({
  reservations,
  selectedId,
  onSelect,
  onApprove,
}: {
  reservations: PaymentReservationCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onApprove: (reservation: PaymentReservationCase) => void;
}) {
  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No payment records"
        description="No payment records match the current filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <div
          key={reservation.id}
          onClick={() => onSelect(reservation.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(reservation.id);
            }
          }}
          role="button"
          tabIndex={0}
          className={cn(
            "w-full rounded-2xl border px-4 py-4 text-left transition",
            selectedId === reservation.id
              ? "border-[#1f1f2d] bg-[#f8f8fb]"
              : "border-[#e5e7eb] bg-white hover:border-[#cfd3e1]"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1f1f2d]">
                {formatCurrency(
                  reservation.payment.amount,
                  reservation.payment.currency
                )}
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                {reservation.student.displayName} x{" "}
                {reservation.mentor?.displayName ?? "Unknown mentor"}
              </p>
              <p className="mt-1 text-xs text-[#606579]">
                Booking #{reservation.bookingId} · {formatDateTime(reservation.startTime)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                label={humanizeToken(reservation.payment.status)}
                tone={paymentStatusTone(reservation.payment.status)}
              />
              {reservation.payout && (
                <Badge
                  label={`Payout ${humanizeToken(reservation.payout.status)}`}
                  tone={payoutStatusTone(reservation.payout.status)}
                />
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {reservation.flags.map((flag) => (
              <Badge key={flag.type} label={flag.label} tone={flag.tone} />
            ))}
            {reservation.paymentApprovalEligible && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onApprove(reservation);
                }}
                className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
              >
                Approve payout
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReservationDetail({
  reservation,
}: {
  reservation: AdminReservationCase | null;
}) {
  if (!reservation) {
    return (
      <EmptyState
        title="Select a reservation"
        description="Choose a reservation case to inspect student, mentor, payment, and meeting details."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">Reservation case</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              Booking #{reservation.bookingId}
            </h3>
          </div>
          <Badge
            label={humanizeToken(reservation.status)}
            tone={bookingStatusTone(reservation.status)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {reservation.payment && (
            <Badge
              label={`Payment ${humanizeToken(reservation.payment.status)}`}
              tone={paymentStatusTone(reservation.payment.status)}
            />
          )}
          {reservation.payout && (
            <Badge
              label={`Payout ${humanizeToken(reservation.payout.status)}`}
              tone={payoutStatusTone(reservation.payout.status)}
            />
          )}
          {renderFlagBadges(reservation.flags)}
        </div>
      </div>

      <DetailBlock title="Reservation">
        <DetailRow
          label="Lesson time"
          value={`${formatDateTime(reservation.startTime)} - ${formatDateTime(
            reservation.endTime
          )}`}
        />
        <DetailRow label="Created" value={formatDateTime(reservation.createdAt)} />
        <DetailRow label="Expires" value={formatDateTime(reservation.expiresAt)} />
        <DetailRow
          label="Meeting"
          value={
            reservation.hasMeetingLink
              ? `${reservation.meetingProvider ?? "Meeting ready"}`
              : "Not ready"
          }
        />
      </DetailBlock>

      <DetailBlock title="Student">
        <DetailRow label="Name" value={reservation.student.displayName} />
        <DetailRow
          label="Handle"
          value={reservation.student.username ? `@${reservation.student.username}` : "-"}
        />
        <DetailRow label="Role" value={reservation.student.role ?? "-"} />
        <DetailRow label="Timezone" value={reservation.student.timezone ?? "-"} />
        <DetailRow label="Phone" value={reservation.student.phone ?? "-"} />
      </DetailBlock>

      <DetailBlock title="Mentor">
        <DetailRow
          label="Name"
          value={reservation.mentor?.displayName ?? "Unknown mentor"}
        />
        <DetailRow label="Email" value={reservation.mentor?.email ?? "-"} />
        <DetailRow label="Timezone" value={reservation.mentor?.timezone ?? "-"} />
        <DetailRow
          label="Hourly rate"
          value={
            reservation.mentor?.hourlyRate != null
              ? `$${reservation.mentor.hourlyRate}/hr`
              : "-"
          }
        />
        <DetailRow
          label="Stripe ready"
          value={reservation.mentor?.stripeOnboardingCompleted ? "Yes" : "No"}
        />
      </DetailBlock>

      <DetailBlock title="Payment">
        <DetailRow
          label="Amount"
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
          label="Payment status"
          value={reservation.payment ? humanizeToken(reservation.payment.status) : "-"}
        />
        <DetailRow
          label="Payout status"
          value={reservation.payout ? humanizeToken(reservation.payout.status) : "-"}
        />
        <DetailRow
          label="Paid at"
          value={formatDateTime(reservation.payment?.paidAt)}
        />
        <DetailRow
          label="Student email"
          value={
            reservation.payment?.studentConfirmationEmailSentAt
              ? formatDateTime(reservation.payment.studentConfirmationEmailSentAt)
              : "Not sent"
          }
        />
        <DetailRow
          label="Mentor email"
          value={
            reservation.payment?.mentorBookingEmailSentAt
              ? formatDateTime(reservation.payment.mentorBookingEmailSentAt)
              : "Not sent"
          }
        />
      </DetailBlock>
    </div>
  );
}

function UserDetail({
  user,
  reservations,
  onOpenCase,
}: {
  user: AdminUserCase | null;
  reservations: AdminReservationCase[];
  onOpenCase: (reservationId: string) => void;
}) {
  if (!user) {
    return (
      <EmptyState
        title="Select a user"
        description="Choose a user to inspect account health, booking history, and linked cases."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">User account</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              {user.displayName}
            </h3>
          </div>
          <Badge
            label={user.stateLabel}
            tone={user.needsAttention ? "warning" : "neutral"}
          />
        </div>
      </div>

      <DetailBlock title="Profile">
        <DetailRow label="Handle" value={user.username ? `@${user.username}` : "-"} />
        <DetailRow label="Role" value={user.role ?? "-"} />
        <DetailRow label="Timezone" value={user.timezone ?? "-"} />
        <DetailRow label="Phone" value={user.phone ?? "-"} />
        <DetailRow label="Joined" value={formatDateOnly(user.createdAt)} />
        <DetailRow
          label="Linked mentor profile"
          value={user.hasMentorProfile ? "Yes" : "No"}
        />
      </DetailBlock>

      <DetailBlock title="Activity">
        <DetailRow label="Reservations" value={user.counts.totalReservations} />
        <DetailRow label="Pending" value={user.counts.pendingReservations} />
        <DetailRow label="Upcoming" value={user.counts.confirmedReservations} />
        <DetailRow label="Completed" value={user.counts.completedReservations} />
        <DetailRow label="Failed payments" value={user.counts.failedPayments} />
        <DetailRow label="Refunded payments" value={user.counts.refundedPayments} />
      </DetailBlock>

      <DetailBlock title="Recent reservation cases">
        <RecentReservationList
          reservationIds={user.recentReservationIds}
          reservations={reservations}
          onOpenCase={onOpenCase}
        />
      </DetailBlock>
    </div>
  );
}

function MentorDetail({
  mentor,
  reservations,
  onOpenCase,
}: {
  mentor: AdminMentorCase | null;
  reservations: AdminReservationCase[];
  onOpenCase: (reservationId: string) => void;
}) {
  if (!mentor) {
    return (
      <EmptyState
        title="Select a mentor"
        description="Choose a mentor to inspect payout readiness, lesson load, and linked cases."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">Mentor operations</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              {mentor.displayName}
            </h3>
          </div>
          <Badge
            label={mentor.stateLabel}
            tone={mentor.needsAttention ? "warning" : "neutral"}
          />
        </div>
      </div>

      <DetailBlock title="Mentor profile">
        <DetailRow label="Email" value={mentor.email ?? "-"} />
        <DetailRow label="Timezone" value={mentor.timezone ?? "-"} />
        <DetailRow label="Phone" value={mentor.phone ?? "-"} />
        <DetailRow
          label="Hourly rate"
          value={mentor.hourlyRate != null ? `$${mentor.hourlyRate}/hr` : "-"}
        />
        <DetailRow
          label="Stripe ready"
          value={mentor.stripeOnboardingCompleted ? "Yes" : "No"}
        />
        <DetailRow
          label="Stripe account"
          value={mentor.stripeAccountId ?? "Not connected"}
        />
      </DetailBlock>

      <DetailBlock title="Operations load">
        <DetailRow label="Reservations" value={mentor.counts.totalReservations} />
        <DetailRow label="Pending" value={mentor.counts.pendingReservations} />
        <DetailRow label="Upcoming" value={mentor.counts.confirmedReservations} />
        <DetailRow label="Completed" value={mentor.counts.completedReservations} />
        <DetailRow
          label="Awaiting payout approval"
          value={mentor.counts.awaitingPayoutApproval}
        />
        <DetailRow label="Paid payouts" value={mentor.counts.paidPayouts} />
        <DetailRow label="Failed payouts" value={mentor.counts.failedPayouts} />
      </DetailBlock>

      <DetailBlock title="Recent reservation cases">
        <RecentReservationList
          reservationIds={mentor.recentReservationIds}
          reservations={reservations}
          onOpenCase={onOpenCase}
        />
      </DetailBlock>
    </div>
  );
}

function PaymentDetail({
  reservation,
  onApprove,
}: {
  reservation: PaymentReservationCase | null;
  onApprove: (reservation: PaymentReservationCase) => void;
}) {
  if (!reservation) {
    return (
      <EmptyState
        title="Select a payment"
        description="Choose a payment to inspect payout status and operational follow-up details."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#606579]">Payment case</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1f1f2d]">
              {formatCurrency(
                reservation.payment.amount,
                reservation.payment.currency
              )}
            </h3>
            <p className="mt-2 text-sm text-[#606579]">
              Booking #{reservation.bookingId} · {reservation.student.displayName} x{" "}
              {reservation.mentor?.displayName ?? "Unknown mentor"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              label={humanizeToken(reservation.payment.status)}
              tone={paymentStatusTone(reservation.payment.status)}
            />
            {reservation.payout && (
              <Badge
                label={`Payout ${humanizeToken(reservation.payout.status)}`}
                tone={payoutStatusTone(reservation.payout.status)}
              />
            )}
          </div>
        </div>

        {reservation.paymentApprovalEligible && (
          <button
            type="button"
            onClick={() => onApprove(reservation)}
            className="mt-4 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Approve payout
          </button>
        )}
      </div>

      <DetailBlock title="Payment">
        <DetailRow
          label="Created"
          value={formatDateTime(reservation.payment.createdAt)}
        />
        <DetailRow label="Paid at" value={formatDateTime(reservation.payment.paidAt)} />
        <DetailRow
          label="Student confirmation email"
          value={
            reservation.payment.studentConfirmationEmailSentAt
              ? formatDateTime(reservation.payment.studentConfirmationEmailSentAt)
              : "Not sent"
          }
        />
        <DetailRow
          label="Mentor booking email"
          value={
            reservation.payment.mentorBookingEmailSentAt
              ? formatDateTime(reservation.payment.mentorBookingEmailSentAt)
              : "Not sent"
          }
        />
      </DetailBlock>

      <DetailBlock title="Reservation">
        <DetailRow label="Status" value={humanizeToken(reservation.status)} />
        <DetailRow label="Lesson time" value={formatDateTime(reservation.startTime)} />
        <DetailRow
          label="Meeting status"
          value={reservation.hasMeetingLink ? "Ready" : "Not ready"}
        />
        <DetailRow
          label="Meeting provider"
          value={reservation.meetingProvider ?? "-"}
        />
      </DetailBlock>

      <DetailBlock title="Case flags">
        {reservation.flags.length > 0 ? (
          renderFlagBadges(reservation.flags)
        ) : (
          <p className="text-sm text-[#606579]">No open flags on this payment.</p>
        )}
      </DetailBlock>
    </div>
  );
}

export function AdminOperationsConsole({
  defaultTab = "reservations",
}: {
  defaultTab?: AdminTab;
}) {
  const router = useRouter();
  const [data, setData] = useState<AdminOperationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [confirmTarget, setConfirmTarget] =
    useState<PaymentReservationCase | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(
    null
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  async function fetchDashboard() {
    try {
      setError(null);
      const response = await fetch("/api/admin/operations", {
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        router.push("/");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch admin operations");
      }

      const payload = (await response.json()) as AdminOperationsResponse;
      setData(payload);
    } catch {
      setError("Failed to load admin operations data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reservations = data?.reservations ?? [];
  const users = data?.users ?? [];
  const mentors = data?.mentors ?? [];
  const paymentCases = reservations.filter(isPaymentReservationCase);

  const filteredReservations = reservations.filter((reservation) => {
    if (attentionOnly && !reservation.needsAttention) return false;
    if (!query) return true;

    const haystack = [
      reservation.bookingId,
      reservation.status,
      reservation.student.displayName,
      reservation.student.username,
      reservation.mentor?.displayName,
      reservation.mentor?.email,
      reservation.payment?.status,
      reservation.payout?.status,
      ...reservation.flags.map((flag) => flag.label),
    ]
      .filter(Boolean)
      .join(" ");

    return searchMatches(haystack, query);
  });

  const filteredUsers = users.filter((user) => {
    if (attentionOnly && !user.needsAttention) return false;
    if (!query) return true;

    const haystack = [
      user.displayName,
      user.username,
      user.role,
      user.stateLabel,
    ]
      .filter(Boolean)
      .join(" ");

    return searchMatches(haystack, query);
  });

  const filteredMentors = mentors.filter((mentor) => {
    if (attentionOnly && !mentor.needsAttention) return false;
    if (!query) return true;

    const haystack = [
      mentor.displayName,
      mentor.email,
      mentor.stateLabel,
      mentor.stripeAccountId,
    ]
      .filter(Boolean)
      .join(" ");

    return searchMatches(haystack, query);
  });

  const filteredPayments = paymentCases.filter((reservation) => {
    if (attentionOnly && !reservation.needsAttention) return false;
    if (!query) return true;

    const haystack = [
      reservation.bookingId,
      reservation.payment.id,
      reservation.payment.status,
      reservation.payout?.status,
      reservation.student.displayName,
      reservation.mentor?.displayName,
      ...reservation.flags.map((flag) => flag.label),
    ]
      .filter(Boolean)
      .join(" ");

    return searchMatches(haystack, query);
  });

  const selectedReservation = pickSelectedItem(
    filteredReservations,
    selectedReservationId
  );
  const selectedUser = pickSelectedItem(filteredUsers, selectedUserId);
  const selectedMentor = pickSelectedItem(filteredMentors, selectedMentorId);
  const selectedPayment = pickSelectedItem(filteredPayments, selectedPaymentId);

  async function handleRelease(reservation: PaymentReservationCase) {
    setReleasing(true);
    try {
      const response = await fetch("/api/stripe/payouts/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: reservation.payment.id }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        window.alert(payload.error || "Failed to release the payout.");
        return;
      }

      setConfirmTarget(null);
      await fetchDashboard();
    } catch {
      window.alert("Failed to release the payout.");
    } finally {
      setReleasing(false);
    }
  }

  function handleOpenReservationCase(reservationId: string) {
    setActiveTab("reservations");
    setSelectedReservationId(reservationId);
  }

  const activeCount =
    activeTab === "reservations"
      ? filteredReservations.length
      : activeTab === "users"
        ? filteredUsers.length
        : activeTab === "mentors"
          ? filteredMentors.length
          : filteredPayments.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] px-6 py-8">
        <p className="text-sm text-[#606579]">Loading admin operations...</p>
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
            <p className="text-sm font-medium text-[#606579]">Bridgeee Admin</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#1f1f2d]">
              Operations Console
            </h1>
            <p className="mt-2 text-sm text-[#606579]">
              Reservations, user state, mentor state, and payout cases in one
              place. Updated {formatDateTime(data?.updatedAt)}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-[#d5d7df] bg-white px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb]"
            >
              Admin home
            </Link>
            <Link
              href="/admin/payments"
              className="rounded-xl border border-[#d5d7df] bg-white px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb]"
            >
              Payout approvals
            </Link>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f1f2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#11111b]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Reservations needing attention"
            value={data?.summary.reservationsNeedingAttention ?? 0}
            tone="warning"
            onClick={() => {
              setActiveTab("reservations");
              setAttentionOnly(true);
            }}
          />
          <SummaryCard
            label="Awaiting payout approval"
            value={data?.summary.awaitingPayoutApproval ?? 0}
            tone="info"
            onClick={() => {
              setActiveTab("payments");
              setAttentionOnly(true);
            }}
          />
          <SummaryCard
            label="Users needing attention"
            value={data?.summary.usersNeedingAttention ?? 0}
            tone="warning"
            onClick={() => {
              setActiveTab("users");
              setAttentionOnly(true);
            }}
          />
          <SummaryCard
            label="Mentors needing attention"
            value={data?.summary.mentorsNeedingAttention ?? 0}
            tone="warning"
            onClick={() => {
              setActiveTab("mentors");
              setAttentionOnly(true);
            }}
          />
        </div>

        <p className="mt-4 text-sm text-[#606579]">
          Total reservations {data?.summary.totalReservations ?? 0} · Payment
          failures {data?.summary.paymentFailures ?? 0}
        </p>

        <section className="mt-8 rounded-[28px] border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-4 py-4 lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {TAB_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveTab(option.id)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      activeTab === option.id
                        ? "bg-[#1f1f2d] text-white"
                        : "bg-[#f3f4f6] text-[#606579] hover:bg-[#e5e7eb]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a90a2]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search ${activeTab}`}
                    className="w-full rounded-xl border border-[#d5d7df] bg-white py-2 pl-9 pr-3 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d] sm:w-72"
                  />
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-[#d5d7df] px-3 py-2 text-sm text-[#1f1f2d]">
                  <input
                    type="checkbox"
                    checked={attentionOnly}
                    onChange={(event) => setAttentionOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-[#cbd5e1]"
                  />
                  Attention only
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:p-6">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1f1f2d]">
                  {humanizeToken(activeTab)}
                </h2>
                <span className="text-sm text-[#606579]">{activeCount} results</span>
              </div>

              <div className="max-h-[720px] overflow-y-auto pr-1">
                {activeTab === "reservations" && (
                  <ReservationList
                    reservations={filteredReservations}
                    selectedId={selectedReservation?.id ?? null}
                    onSelect={setSelectedReservationId}
                  />
                )}

                {activeTab === "users" && (
                  <UserList
                    users={filteredUsers}
                    selectedId={selectedUser?.id ?? null}
                    onSelect={setSelectedUserId}
                  />
                )}

                {activeTab === "mentors" && (
                  <MentorList
                    mentors={filteredMentors}
                    selectedId={selectedMentor?.id ?? null}
                    onSelect={setSelectedMentorId}
                  />
                )}

                {activeTab === "payments" && (
                  <PaymentList
                    reservations={filteredPayments}
                    selectedId={selectedPayment?.id ?? null}
                    onSelect={setSelectedPaymentId}
                    onApprove={setConfirmTarget}
                  />
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1f1f2d]">
                  Case detail
                </h2>
              </div>

              {activeTab === "reservations" && (
                <ReservationDetail reservation={selectedReservation} />
              )}
              {activeTab === "users" && (
                <UserDetail
                  user={selectedUser}
                  reservations={reservations}
                  onOpenCase={handleOpenReservationCase}
                />
              )}
              {activeTab === "mentors" && (
                <MentorDetail
                  mentor={selectedMentor}
                  reservations={reservations}
                  onOpenCase={handleOpenReservationCase}
                />
              )}
              {activeTab === "payments" && (
                <PaymentDetail
                  reservation={selectedPayment}
                  onApprove={setConfirmTarget}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(confirmTarget)}
        onClose={() => !releasing && setConfirmTarget(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#1f1f2d]">
              Approve payout?
            </Dialog.Title>

            {confirmTarget && (
              <div className="mt-3 space-y-2 text-sm text-[#4b5563]">
                <p>
                  This will send{" "}
                  {formatCurrency(
                    confirmTarget.payment.amount,
                    confirmTarget.payment.currency
                  )}{" "}
                  to {confirmTarget.mentor?.displayName ?? "the mentor"}.
                </p>
                <p>
                  Booking #{confirmTarget.bookingId} · Lesson time{" "}
                  {formatDateTime(confirmTarget.startTime)}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={releasing}
                className="flex-1 rounded-xl border border-[#d5d7df] px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmTarget || releasing}
                onClick={() => confirmTarget && void handleRelease(confirmTarget)}
                className="flex-1 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {releasing ? "Approving..." : "Approve payout"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
