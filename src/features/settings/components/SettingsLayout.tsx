"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../hooks/useProfile";
import { SettingsNav } from "./SettingsNav";
import type { SettingsTab } from "./SettingsNav";
import { AccountSettings } from "./AccountSettings";
import { PasswordChangeSection } from "./PasswordChangeSection";
import { SettingsTopTabs } from "./SettingsTopTabs";
import { isEmailProvider } from "@/features/auth/utils/authProvider";

export function SettingsLayout() {
  const router = useRouter();
  const { user, loading } = useProfile();

  const [active, setActive] = useState<SettingsTab>("account");

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
  // NOTE: loading を条件に含めると、パスワード変更などで
  // セッションリフレッシュが走った際にページ全体が Loading に戻ってしまうため、
  // 初回ロード完了を示す authChecked のみで判定する
  if (!authChecked) {
    return <div className="px-6 py-10 text-sm text-gray-400">Loading...</div>;
  }

  // 未ログインはリダイレクト中なので画面は出さない
  if (!user) return null;

  const showPassword = isEmailProvider(user);

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <SettingsTopTabs role="student" activeTabId="settings" />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-16 lg:py-10">
        <SettingsNav
          active={active}
          onChange={setActive}
          showPassword={showPassword}
        />
        <section className="w-full min-w-0 max-w-[760px]">
          {active === "account" && <AccountSettings />}
          {active === "password" && (
            <>
              <h1 className="mb-6 text-3xl font-bold">Change Password</h1>
              <PasswordChangeSection />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
