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
      if (res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPayments(data.payments);
    } catch {
      setError("決済データの取得に失敗しました");
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
        alert(data.error || "入金処理に失敗しました");
        return;
      }
      setConfirmTarget(null);
      fetchPayments();
    } catch {
      alert("入金処理に失敗しました");
    } finally {
      setReleasing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (bookingStatus: string | undefined) => {
    switch (bookingStatus) {
      case "confirmed":
        return (
          <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
            レッスン完了待ち
          </span>
        );
      case "completed":
        return (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            入金済み
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-[#6b7280]/10 px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
            {bookingStatus ?? "不明"}
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
        <p className="text-sm text-[#606579]">読み込み中...</p>
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
        <h1 className="text-lg font-semibold text-[#1f1f2d]">Bridgee Admin</h1>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <h2 className="mb-6 text-[32px] font-bold text-[#1f1f2d]">
          入金承認管理
        </h2>

        <p className="mb-6 text-sm text-[#606579]">
          合計: {payments.length}件 / 承認待ち: {confirmedPayments.length}件 /
          入金済み: {completedPayments.length}件
        </p>

        {/* Desktop: テーブル */}
        <div className="hidden md:block">
          <div className="rounded-xl border border-[#e3e4ea] bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e3e4ea] text-left text-sm text-[#606579]">
                  <th className="px-4 py-3 font-medium">メンター</th>
                  <th className="px-4 py-3 font-medium">金額</th>
                  <th className="px-4 py-3 font-medium">レッスン日時</th>
                  <th className="px-4 py-3 font-medium">状態</th>
                  <th className="px-4 py-3 font-medium">操作</th>
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
                            承認
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
                    承認する
                  </button>
                )}
            </div>
          ))}
        </div>

        {payments.length === 0 && (
          <p className="text-center text-sm text-[#606579]">
            決済データがありません
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
            入金を承認しますか？
          </Dialog.Title>
          {confirmTarget && (
            <p className="mt-2 text-sm text-[#4b5563]">
              {confirmTarget.mentorName}さんへ
              {formatAmount(confirmTarget.amount)}
              の入金を実行します。この操作は取り消せません。
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setConfirmTarget(null)}
              disabled={releasing}
              className="flex-1 rounded-lg border border-[#cfd3e1] bg-white px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-gray-50 disabled:opacity-60"
            >
              キャンセル
            </button>
            <button
              onClick={() =>
                confirmTarget && handleRelease(confirmTarget.id)
              }
              disabled={releasing}
              className="flex-1 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {releasing ? "処理中..." : "承認する"}
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
