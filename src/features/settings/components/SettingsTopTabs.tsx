"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/features/auth/types";
import {
  getSettingsTopTabs,
  type SettingsTopTab,
  type SettingsTopTabId,
} from "../constants/topTabs";

type Props = {
  role: UserRole;
  activeTabId: SettingsTopTabId;
  tabs?: SettingsTopTab[];
};

export function SettingsTopTabs({ role, activeTabId, tabs }: Props) {
  const t = useTranslations("settings.topTabs");
  const renderedTabs = tabs ?? getSettingsTopTabs(role);

  return (
    <div className="border-b border-[#e6e7eb] bg-white">
      <div className="flex h-14 items-end gap-8 px-6">
        {renderedTabs.map((tab) => {
          const selected = tab.id === activeTabId;
          const href = tab.href;
          const isLink = tab.clickable && typeof href === "string";

          return (
            <div
              key={tab.id}
              className={`relative pb-3 text-[17px] font-medium ${
                selected
                  ? tab.id === "messages"
                    ? "text-[#2563eb]"
                    : "text-[#1f1f2d]"
                  : "text-[#52576a]"
              }`}
            >
              {isLink ? (
                <Link
                  href={href}
                  className={
                    tab.id === "messages"
                      ? "hover:text-[#2563eb]"
                      : "hover:text-[#1f1f2d]"
                  }
                >
                  {t(tab.label)}
                </Link>
              ) : (
                t(tab.label)
              )}
              {selected && (
                <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#2563eb]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
