"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  COUNTRIES,
  LANGUAGES,
  LANGUAGE_PROFICIENCY_OPTIONS,
} from "@/features/shared/constants/options";
import type {
  MentorSettingsAboutForm,
  MentorSettingsLanguage,
} from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsAboutForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsAboutForm>) => void;
  onSave: () => Promise<void>;
};

export function AboutSection({ data, saving, message, onChange, onSave }: Props) {
  const [expertiseInput, setExpertiseInput] = useState("");

  const canAddExpertise = useMemo(
    () => expertiseInput.trim().length > 0,
    [expertiseInput]
  );

  const addLanguage = () => {
    const newLanguage: MentorSettingsLanguage = {
      id: crypto.randomUUID(),
      languageCode: "",
      languageName: "",
      proficiencyLevel: "b2",
    };
    onChange({ languages: [...data.languages, newLanguage] });
  };

  const updateLanguage = (
    id: string,
    field: keyof MentorSettingsLanguage,
    value: string
  ) => {
    const next = data.languages.map((item) => {
      if (item.id !== id) return item;
      if (field === "languageCode") {
        const selected = LANGUAGES.find((lang) => lang.code === value);
        return {
          ...item,
          languageCode: value,
          languageName: selected?.name ?? "",
        };
      }

      return { ...item, [field]: value };
    });

    onChange({ languages: next });
  };

  const removeLanguage = (id: string) => {
    const next = data.languages.filter((item) => item.id !== id);
    onChange({
      languages:
        next.length > 0
          ? next
          : [
              {
                id: crypto.randomUUID(),
                languageCode: "",
                languageName: "",
                proficiencyLevel: "b2",
              },
            ],
    });
  };

  const addExpertise = () => {
    const value = expertiseInput.trim();
    if (!value || data.expertise.includes(value)) return;
    onChange({ expertise: [...data.expertise, value] });
    setExpertiseInput("");
  };

  const removeExpertise = (value: string) => {
    onChange({ expertise: data.expertise.filter((item) => item !== value) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2d3348]">First name</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="w-full rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2d3348]">Last name</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="w-full rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Email</label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Country of birth</label>
        <select
          value={data.countryCode}
          onChange={(e) => onChange({ countryCode: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Select a country</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Phone number</label>
        <div className="flex gap-2">
          <select
            value={data.phoneCountryCode}
            onChange={(e) => onChange({ phoneCountryCode: e.target.value })}
            className="w-24 rounded-[10px] border border-[#cfd3e1] bg-white px-2 py-2.5 text-sm"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.phoneCode}>
                {country.phoneCode}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            className="flex-1 rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Expertise</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addExpertise();
              }
            }}
            className="flex-1 rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={addExpertise}
            disabled={!canAddExpertise}
            className="inline-flex h-[42px] items-center gap-1 rounded-[10px] border border-[#cfd3e1] px-3 text-sm font-semibold disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {data.expertise.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.expertise.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-[#f2f4f9] px-3 py-1 text-xs text-[#434a60]"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeExpertise(item)}
                  className="rounded-full p-0.5 hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">Languages</label>
        <div className="space-y-2">
          {data.languages.map((language) => (
            <div key={language.id} className="flex gap-2">
              <select
                value={language.languageCode}
                onChange={(e) =>
                  updateLanguage(language.id, "languageCode", e.target.value)
                }
                className="flex-1 rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Select language</option>
                {LANGUAGES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
              <select
                value={language.proficiencyLevel}
                onChange={(e) =>
                  updateLanguage(language.id, "proficiencyLevel", e.target.value)
                }
                className="w-36 rounded-[10px] border border-[#cfd3e1] bg-white px-3 py-2.5 text-sm"
              >
                {LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeLanguage(language.id)}
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#cfd3e1] text-[#50566d]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLanguage}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#4b5575]"
          >
            <Plus className="h-4 w-4" />
            Add language
          </button>
        </div>
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
