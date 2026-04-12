"use client";

import { useTranslations } from "next-intl";
import type { MentorSettingsDescriptionForm } from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsDescriptionForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsDescriptionForm>) => void;
  onSave: () => Promise<void>;
};

export function DescriptionSection({
  data,
  saving,
  message,
  onChange,
  onSave,
}: Props) {
  const t = useTranslations("settings.mentorSections");
  const tc = useTranslations("common");

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">{t("introduceYourself")}</label>
        <textarea
          rows={6}
          value={data.introduction}
          onChange={(e) => onChange({ introduction: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">{t("workExperience")}</label>
        <textarea
          rows={4}
          value={data.workExperience}
          onChange={(e) => onChange({ workExperience: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">{t("motivateStudents")}</label>
        <textarea
          rows={4}
          value={data.motivation}
          onChange={(e) => onChange({ motivation: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">{t("headline")}</label>
        <input
          type="text"
          value={data.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
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
          {saving ? tc("saving") : tc("save")}
        </button>
        {message && <p className="mt-2 text-sm text-[#5e6478]">{message}</p>}
      </div>
    </div>
  );
}
