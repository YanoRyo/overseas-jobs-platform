"use client";

import { SettingsNavBase } from "./SettingsNavBase";

export type SettingsTab = "account" | "password";

const BASE_TABS: { id: SettingsTab; label: string }[] = [
  { id: "account", label: "Account" },
];

const TABS_WITH_PASSWORD: { id: SettingsTab; label: string }[] = [
  ...BASE_TABS,
  { id: "password", label: "Password" },
];

type Props = {
  active: SettingsTab;
  onChange: (v: SettingsTab) => void;
  showPassword: boolean;
};

export function SettingsNav({ active, onChange, showPassword }: Props) {
  const tabs = showPassword ? TABS_WITH_PASSWORD : BASE_TABS;
  return <SettingsNavBase items={tabs} active={active} onChange={onChange} />;
}
