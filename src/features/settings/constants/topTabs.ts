import type { UserRole } from "@/features/auth/types";

export type SettingsTopTabId = string;

export type SettingsTopTab = {
  id: SettingsTopTabId;
  label: string;
  href?: string;
  clickable: boolean;
  roles: UserRole[];
};

export const SETTINGS_TOP_TABS: SettingsTopTab[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    clickable: true,
    roles: ["mentor", "student"],
  },
  {
    id: "messages",
    label: "Messages",
    clickable: false,
    roles: ["mentor", "student"],
  },
  {
    id: "my-lessons",
    label: "My lessons",
    clickable: false,
    roles: ["mentor", "student"],
  },
  {
    id: "learn",
    label: "Learn",
    clickable: false,
    roles: ["mentor", "student"],
  },
  {
    id: "settings",
    label: "Settings",
    clickable: false,
    roles: ["mentor", "student"],
  },
];

export function getSettingsTopTabs(role: UserRole): SettingsTopTab[] {
  return SETTINGS_TOP_TABS.filter((tab) => tab.roles.includes(role));
}
