"use client";

import type { MentorSettingsVideoForm } from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsVideoForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsVideoForm>) => void;
  onSave: () => Promise<void>;
};

export function VideoSection({ data, saving, message, onChange, onSave }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Video URL (YouTube / Vimeo)</label>
        <input
          type="url"
          value={data.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
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
