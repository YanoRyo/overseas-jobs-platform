"use client";

import Link from "next/link";

const TABS = ["Home", "Messages", "My lessons", "Learn", "Settings"] as const;

export function MentorTopTabs() {
  return (
    <div className="border-b border-[#e6e7eb] bg-white">
      <div className="flex h-14 items-end gap-8 px-6">
        {TABS.map((tab) => {
          const active = tab === "Settings";
          const isHome = tab === "Home";
          return (
            <div
              key={tab}
              className={`relative pb-3 text-[17px] font-medium ${
                active ? "text-[#1f1f2d]" : "text-[#52576a]"
              }`}
            >
              {isHome ? (
                <Link href="/" className="hover:text-[#1f1f2d]">
                  {tab}
                </Link>
              ) : (
                tab
              )}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#2563eb]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
