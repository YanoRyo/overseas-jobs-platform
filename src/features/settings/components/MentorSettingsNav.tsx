"use client";

import { useTranslations } from "next-intl";
import type { MentorSettingsSection } from "../types/mentorSettings";
import { SettingsNavBase } from "./SettingsNavBase";

const BASE_SECTION_KEYS: { id: MentorSettingsSection; labelKey: string }[] = [
  { id: "about", labelKey: "about" },
  { id: "photo", labelKey: "photo" },
  { id: "education", labelKey: "education" },
  { id: "description", labelKey: "description" },
  { id: "video", labelKey: "video" },
  { id: "availability", labelKey: "availability" },
  { id: "pricing", labelKey: "pricing" },
  { id: "payout", labelKey: "payout" },
];

const SECTIONS_WITH_PASSWORD_KEYS: { id: MentorSettingsSection; labelKey: string }[] = [
  ...BASE_SECTION_KEYS,
  { id: "password", labelKey: "password" },
];

type Props = {
  active: MentorSettingsSection;
  onChange: (section: MentorSettingsSection) => void;
  showPassword: boolean;
};

export function MentorSettingsNav({ active, onChange, showPassword }: Props) {
  const t = useTranslations("settings.mentorNav");
  const sectionKeys = showPassword ? SECTIONS_WITH_PASSWORD_KEYS : BASE_SECTION_KEYS;
  const sections = sectionKeys.map((s) => ({ id: s.id, label: t(s.labelKey) }));
  return (
    <SettingsNavBase items={sections} active={active} onChange={onChange} />
  );
}
