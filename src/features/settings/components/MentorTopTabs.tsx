"use client";

const TABS = ["Home", "Messages", "My lessons", "Learn", "Settings"] as const;

export function MentorTopTabs() {
  return (
    <div className="border-b border-[#e6e7eb] bg-white">
      <div className="mx-auto flex h-11 max-w-[1200px] items-end gap-7 px-6">
        {TABS.map((tab) => {
          const active = tab === "Settings";
          return (
            <div
              key={tab}
              className={`relative pb-2 text-sm font-medium ${
                active ? "text-[#1f1f2d]" : "text-[#52576a]"
              }`}
            >
              {tab}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-[3px] bg-[#ff6ea9]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
