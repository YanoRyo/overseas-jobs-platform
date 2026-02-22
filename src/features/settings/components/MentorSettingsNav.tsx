"use client";

import type { MentorSettingsSection } from "../types/mentorSettings";

const SECTIONS: { id: MentorSettingsSection; label: string }[] = [
  { id: "about", label: "About" },
  { id: "photo", label: "Photo" },
  { id: "education", label: "Education" },
  { id: "description", label: "Description" },
  { id: "video", label: "Video" },
  { id: "availability", label: "Availability" },
  { id: "pricing", label: "Pricing" },
];

type Props = {
  active: MentorSettingsSection;
  onChange: (section: MentorSettingsSection) => void;
};

export function MentorSettingsNav({ active, onChange }: Props) {
  return (
    <nav className="mt-4 w-56">
      <ul className="space-y-3">
        {SECTIONS.map((section) => {
          const selected = section.id === active;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onChange(section.id)}
                className={`relative w-full pl-4 text-left text-[18px] font-medium transition ${
                  selected ? "text-[#1f1f2d]" : "text-[#52576a] hover:text-[#1f1f2d]"
                }`}
              >
                {selected && (
                  <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 bg-[#2563eb]" />
                )}
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
