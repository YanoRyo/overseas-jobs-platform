"use client";

const TABS = ["Home", "Messages", "My lessons", "Learn", "Settings"] as const;

export function MentorTopTabs() {
  return (
    <div className="border-b border-[#e6e7eb] bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-end gap-8 px-6">
        {TABS.map((tab) => {
          const active = tab === "Settings";
          return (
            <div
              key={tab}
              className={`relative pb-3 text-[17px] font-medium ${
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
