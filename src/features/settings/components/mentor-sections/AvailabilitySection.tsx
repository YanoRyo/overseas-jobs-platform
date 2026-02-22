"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  DAY_OF_WEEK_OPTIONS,
  TIME_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/features/shared/constants/options";
import type {
  MentorSettingsAvailabilityForm,
  MentorSettingsAvailabilitySlot,
} from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsAvailabilityForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsAvailabilityForm>) => void;
  onSave: () => Promise<void>;
};

export function AvailabilitySection({
  data,
  saving,
  message,
  onChange,
  onSave,
}: Props) {
  const addSlot = () => {
    const next: MentorSettingsAvailabilitySlot = {
      id: crypto.randomUUID(),
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isEnabled: true,
    };

    onChange({ slots: [...data.slots, next] });
  };

  const updateSlot = (
    id: string,
    field: keyof MentorSettingsAvailabilitySlot,
    value: string | number | boolean
  ) => {
    onChange({
      slots: data.slots.map((slot) =>
        slot.id === id ? { ...slot, [field]: value } : slot
      ),
    });
  };

  const removeSlot = (id: string) => {
    onChange({ slots: data.slots.filter((slot) => slot.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Timezone</label>
        <select
          value={data.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        >
          <option value="">Select timezone</option>
          {TIMEZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.offset})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {data.slots.map((slot) => (
          <div
            key={slot.id}
            className="grid grid-cols-1 gap-2 rounded-[10px] border border-[#e3e4ea] bg-[#fafafb] p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]"
          >
            <select
              value={slot.dayOfWeek}
              onChange={(e) =>
                updateSlot(slot.id, "dayOfWeek", Number(e.target.value))
              }
              className="rounded-[10px] border border-[#cfd3e1] bg-white px-2 py-2 text-sm"
            >
              {DAY_OF_WEEK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={slot.startTime}
              onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
              className="rounded-[10px] border border-[#cfd3e1] bg-white px-2 py-2 text-sm"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <select
              value={slot.endTime}
              onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
              className="rounded-[10px] border border-[#cfd3e1] bg-white px-2 py-2 text-sm"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 rounded-[10px] border border-[#cfd3e1] bg-white px-2 py-2 text-sm text-[#2d3348]">
              <input
                type="checkbox"
                checked={slot.isEnabled}
                onChange={(e) => updateSlot(slot.id, "isEnabled", e.target.checked)}
              />
              Enabled
            </label>

            <button
              type="button"
              onClick={() => removeSlot(slot.id)}
              className="inline-flex items-center justify-center rounded-[10px] border border-[#cfd3e1] bg-white px-3"
            >
              <Trash2 className="h-4 w-4 text-[#5c6277]" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#4b5575]"
        >
          <Plus className="h-4 w-4" />
          Add timeslot
        </button>
      </div>

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
