"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../hooks/useProfile";
import { SettingsNav } from "./SettingsNav";
import { AccountSettings } from "./AccountSettings";

export function SettingsLayout() {
  const router = useRouter();
  const { user, loading } = useProfile();

  const [active, setActive] = useState<"account">("account");

  // user が復元されるまで一瞬待つ
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (!loading) setAuthChecked(true);
  }, [loading]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace("/auth/login?redirect=/settings");
    }
  }, [authChecked, user, router]);

  // authChecked になるまでは何も判定しない（チラつき防止）
  if (!authChecked || loading) {
    return <div className="px-6 py-10 text-sm text-gray-400">Loading...</div>;
  }

  // 未ログインはリダイレクト中なので画面は出さない
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex gap-10">
        <SettingsNav active={active} onChange={setActive} />
        {active === "account" && <AccountSettings />}
      </div>
    </div>
  );
}
