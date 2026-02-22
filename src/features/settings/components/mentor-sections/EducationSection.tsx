"use client";

import { DEGREE_TYPE_OPTIONS } from "@/features/shared/constants/options";
import type { MentorSettingsEducationForm } from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsEducationForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsEducationForm>) => void;
  onSave: () => Promise<void>;
};

export function EducationSection({ data, saving, message, onChange, onSave }: Props) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-[#2d3348]">
        <input
          type="checkbox"
          checked={data.hasNoDegree}
          onChange={(e) => onChange({ hasNoDegree: e.target.checked })}
          className="h-4 w-4"
        />
        I don&apos;t have a higher education degree
      </label>

      {!data.hasNoDegree && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2d3348]">University</label>
            <input
              type="text"
              value={data.university}
              onChange={(e) => onChange({ university: e.target.value })}
              className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2d3348]">Degree</label>
            <input
              type="text"
              value={data.degree}
              onChange={(e) => onChange({ degree: e.target.value })}
              className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2d3348]">Degree type</label>
            <select
              value={data.degreeType ?? ""}
              onChange={(e) =>
                onChange({ degreeType: (e.target.value || null) as MentorSettingsEducationForm["degreeType"] })
              }
              className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
            >
              <option value="">Choose degree type...</option>
              {DEGREE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#2d3348]">Specialization</label>
            <input
              type="text"
              value={data.specialization}
              onChange={(e) => onChange({ specialization: e.target.value })}
              className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
            />
          </div>
        </>
      )}

      <div className="pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-11 w-full rounded-[10px] border-2 border-[#1f1f2d] bg-[#ff77ad] text-lg font-semibold text-[#111318] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && <p className="mt-2 text-sm text-[#5e6478]">{message}</p>}
      </div>
    </div>
  );
}
