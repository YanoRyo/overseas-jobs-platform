"use client";

import type { MentorSettingsPricingForm } from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsPricingForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsPricingForm>) => void;
  onSave: () => Promise<void>;
};

export function PricingSection({ data, saving, message, onChange, onSave }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Hourly rate (USD)</label>
        <input
          type="number"
          min={10}
          max={200}
          step={1}
          value={data.hourlyRate || ""}
          onChange={(e) => onChange({ hourlyRate: Number(e.target.value || 0) })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && <p className="mt-2 text-sm text-[#5e6478]">{message}</p>}
      </div>
    </div>
  );
}
