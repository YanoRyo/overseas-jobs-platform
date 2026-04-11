"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";

type PaymentItem = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  booking_id: string;
  user_id: string;
  mentor_id: string;
  booking: {
    id: string;
    status: string;
    start_time: string;
    end_time: string;
  } | null;
  mentorName: string;
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PaymentItem | null>(null);
  const [releasing, setReleasing] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPayments(data.payments);
    } catch {
      setError("Failed to load payment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRelease = async (paymentId: string) => {
    setReleasing(true);
    try {
      const res = await fetch("/api/stripe/payouts/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to release the payout.");
        return;
      }
      setConfirmTarget(null);
      fetchPayments();
    } catch {
      alert("Failed to release the payout.");
    } finally {
      setReleasing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    // DBには timestamp without time zone だがUTC値が入っているため、Zを付与してUTCとして解釈
    return new Date(dateStr + "Z").toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (bookingStatus: string | undefined) => {
    switch (bookingStatus) {
      case "confirmed":
        return (
          <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            Waiting for completion
          </span>
        );
      case "completed":
        return (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Paid out
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-[#6b7280]/10 px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
            {bookingStatus ?? "Unknown"}
          </span>
        );
    }
  };

  const confirmedPayments = payments.filter(
    (p) => p.status === "succeeded" && p.booking?.status === "confirmed"
  );
  const completedPayments = payments.filter(
    (p) => p.booking?.status === "completed"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb] p-8">
        <p className="text-sm text-[#606579]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafb] p-8">
        <p className="text-sm text-[#c32a68]">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <header className="border-b border-[#e3e4ea] bg-white px-8 py-4">
        <h1 className="text-lg font-semibold text-[#1f1f2d]">Bridgeee Admin</h1>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <h2 className="mb-6 text-[32px] font-bold text-[#1f1f2d]">
          Payout approvals
        </h2>

        <p className="mb-6 text-sm text-[#606579]">
          Total: {payments.length} / Awaiting approval: {confirmedPayments.length} / Paid out: {completedPayments.length}
        </p>

        {/* Desktop: テーブル */}
        <div className="hidden md:block">
          <div className="rounded-xl border border-[#e3e4ea] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e3e4ea] text-left text-sm text-[#606579]">
                  <th className="px-4 py-3 font-medium">Mentor</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Lesson time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#e3e4ea] last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm">{p.mentorName}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#606579]">
                      {p.booking
                        ? formatDate(p.booking.start_time)
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(p.booking?.status)}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "succeeded" &&
                        p.booking?.status === "confirmed" && (
                          <button
                            onClick={() => setConfirmTarget(p)}
                            className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]"
                          >
                            Approve
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: カードリスト */}
        <div className="space-y-3 md:hidden">
          {payments.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-[#e3e4ea] bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.mentorName}</span>
                {getStatusBadge(p.booking?.status)}
              </div>
              <p className="mt-1 text-lg font-semibold">
                {formatAmount(p.amount)}
              </p>
              <p className="text-xs text-[#606579]">
                {p.booking ? formatDate(p.booking.start_time) : "-"}
              </p>
              {p.status === "succeeded" &&
                p.booking?.status === "confirmed" && (
                  <button
                    onClick={() => setConfirmTarget(p)}
                    className="mt-3 h-9 w-full rounded-lg bg-[#2563eb] text-sm font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    Approve
                  </button>
                )}
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <p className="text-center text-sm text-[#606579]">
            No payment data found.
          </p>
        )}
      </main>

      {/* 承認確認ダイアログ */}
      <Dialog
        open={!!confirmTarget}
        onClose={() => !releasing && setConfirmTarget(null)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6">
          <Dialog.Title className="text-lg font-semibold text-[#1f1f2d]">
            Approve payout?
          </Dialog.Title>
          {confirmTarget && (
            <p className="mt-2 text-sm text-[#4b5563]">
              This will send {formatAmount(confirmTarget.amount)} to {confirmTarget.mentorName}. This action cannot be undone.
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setConfirmTarget(null)}
              disabled={releasing}
              className="flex-1 rounded-lg border border-[#cfd3e1] bg-white px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                confirmTarget && handleRelease(confirmTarget.id)
              }
              disabled={releasing}
              className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {releasing ? "Processing..." : "Approve"}
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
