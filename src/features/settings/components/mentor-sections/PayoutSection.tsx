"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

type ConnectStatus = {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export function PayoutSection() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/connect/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("ステータスの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetupAccount = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "アカウントの作成に失敗しました");
      if (!data.url) throw new Error("リダイレクトURLを取得できませんでした");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "アカウントの作成に失敗しました");
      setActionLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect/dashboard-link", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ダッシュボードリンクの取得に失敗しました");
      if (!data.url) throw new Error("ダッシュボードURLを取得できませんでした");
      window.open(data.url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ダッシュボードリンクの取得に失敗しました");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[#606579]">Loading...</p>;
  }

  const isOnboarded = status?.chargesEnabled && status?.payoutsEnabled;

  return (
    <div className="space-y-6">
      {isOnboarded ? (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-medium text-[#1f1f2d]">
                口座情報が登録済みです
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                Stripe Express で管理中
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenDashboard}
            disabled={actionLoading}
            className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {actionLoading ? "読み込み中..." : "口座管理ダッシュボード"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#4b5563]">
            レッスン料金を受け取るには、受取口座の設定が必要です。
          </p>

          {status?.hasAccount && status?.detailsSubmitted && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
              <p className="text-sm text-[#4b5563]">
                口座登録は完了していますが、Stripeの審査待ちです。しばらくお待ちください。
              </p>
            </div>
          )}

          <button
            onClick={handleSetupAccount}
            disabled={actionLoading}
            className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {actionLoading ? "読み込み中..." : "受取口座を設定する"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-[#c32a68]">{error}</p>}
    </div>
  );
}
