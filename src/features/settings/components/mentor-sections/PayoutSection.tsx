"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

type ConnectStatus = {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export function PayoutSection() {
  const t = useTranslations("settings.payout");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/connect/status");
      if (!res.ok) throw new Error(t("failedToLoad"));
      const data = await res.json();
      setStatus(data);
    } catch {
      setError(t("failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      if (!res.ok) throw new Error(data.error || t("failedToCreate"));
      if (!data.url) throw new Error(t("failedRedirectUrl"));
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedToCreate")
      );
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
      if (!res.ok) throw new Error(data.error || t("failedDashboardLink"));
      if (!data.url) throw new Error(t("failedDashboardUrl"));
      window.open(data.url, "_blank");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedDashboardLink")
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[#606579]">{tc("loading")}</p>;
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
                {t("accountSetUp")}
              </p>
              <p className="mt-1 text-sm text-[#606579]">
                {t("managedByStripe")}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenDashboard}
            disabled={actionLoading}
            className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {actionLoading ? tc("loading") : t("openDashboard")}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#4b5563]">
            {t("setupDescription")}
          </p>

          {status?.hasAccount && status?.detailsSubmitted && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
              <p className="text-sm text-[#4b5563]">
                {t("pendingReview")}
              </p>
            </div>
          )}

          <button
            onClick={handleSetupAccount}
            disabled={actionLoading}
            className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {actionLoading ? tc("loading") : t("setupButton")}
          </button>
        </>
      )}

      {error && <p className="text-sm text-[#c32a68]">{error}</p>}
    </div>
  );
}
