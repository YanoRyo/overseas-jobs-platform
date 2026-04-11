"use client";

import { useTranslations } from "next-intl";
import { SettingsNavBase } from "./SettingsNavBase";

export type SettingsTab = "account" | "password";

const BASE_TAB_KEYS: { id: SettingsTab; labelKey: string }[] = [
  { id: "account", labelKey: "account" },
];

const TABS_WITH_PASSWORD_KEYS: { id: SettingsTab; labelKey: string }[] = [
  ...BASE_TAB_KEYS,
  { id: "password", labelKey: "password" },
];

type Props = {
  active: SettingsTab;
  onChange: (v: SettingsTab) => void;
  showPassword: boolean;
};

export function SettingsNav({ active, onChange, showPassword }: Props) {
  const t = useTranslations("settings.nav");
  const tabKeys = showPassword ? TABS_WITH_PASSWORD_KEYS : BASE_TAB_KEYS;
  const tabs = tabKeys.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }));
  return <SettingsNavBase items={tabs} active={active} onChange={onChange} />;
}
