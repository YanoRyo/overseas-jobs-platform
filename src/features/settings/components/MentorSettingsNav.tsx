"use client";

import type { MentorSettingsSection } from "../types/mentorSettings";
import { SettingsNavBase } from "./SettingsNavBase";

const BASE_SECTIONS: { id: MentorSettingsSection; label: string }[] = [
  { id: "about", label: "About" },
  { id: "photo", label: "Photo" },
  { id: "education", label: "Education" },
  { id: "description", label: "Description" },
  { id: "video", label: "Video" },
  { id: "availability", label: "Availability" },
  { id: "pricing", label: "Pricing" },
  { id: "payout", label: "Payout" },
];

const SECTIONS_WITH_PASSWORD: { id: MentorSettingsSection; label: string }[] = [
  ...BASE_SECTIONS,
  { id: "password", label: "Password" },
];

type Props = {
  active: MentorSettingsSection;
  onChange: (section: MentorSettingsSection) => void;
  showPassword: boolean;
};

export function MentorSettingsNav({ active, onChange, showPassword }: Props) {
  const sections = showPassword ? SECTIONS_WITH_PASSWORD : BASE_SECTIONS;
  return (
    <SettingsNavBase items={sections} active={active} onChange={onChange} />
  );
}
