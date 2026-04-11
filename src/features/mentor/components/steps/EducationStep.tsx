"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import type { EducationFormData } from "../../types/registration";
import { DEGREE_TYPE_OPTIONS } from "../../../shared/constants/options";
import { StepNavigation } from "../shared/StepNavigation";

type EducationStepProps = {
  data: EducationFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<EducationFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoNext: boolean;
};

export const EducationStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  onSkip,
  canGoNext,
}: EducationStepProps) => {
  const t = useTranslations("mentorRegistration.education");
  const tOptions = useTranslations("options");
  const showFields = !data.hasNoDegree;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="text-secondary mt-2">
          {t("description")}
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          {t("optional")}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* No degree checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasNoDegree}
            onChange={(e) => onUpdate({ hasNoDegree: e.target.checked })}
            className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-primary">
            {t("noDegree")}
          </span>
        </label>

        {/* Education fields */}
        {showFields && (
          <div className="space-y-4">
            {/* University */}
            <div>
              <label
                htmlFor="university"
                className="block text-sm font-medium text-primary mb-1"
              >
                {t("university")}
              </label>
              <input
                type="text"
                id="university"
                value={data.university}
                onChange={(e) => onUpdate({ university: e.target.value })}
                placeholder={t("universityPlaceholder")}
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.university ? "border-error" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.university && (
                <p className="text-error text-sm mt-1">{errors.university}</p>
              )}
            </div>

            {/* Degree */}
            <div>
              <label
                htmlFor="degree"
                className="block text-sm font-medium text-primary mb-1"
              >
                {t("degree")}
              </label>
              <input
                type="text"
                id="degree"
                value={data.degree}
                onChange={(e) => onUpdate({ degree: e.target.value })}
                placeholder={t("degreePlaceholder")}
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.degree ? "border-error" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.degree && (
                <p className="text-error text-sm mt-1">{errors.degree}</p>
              )}
            </div>

            {/* Degree type */}
            <div>
              <label
                htmlFor="degreeType"
                className="block text-sm font-medium text-primary mb-1"
              >
                {t("degreeType")}
              </label>
              <select
                id="degreeType"
                value={data.degreeType || ""}
                onChange={(e) =>
                  onUpdate({
                    degreeType:
                      (e.target.value as EducationFormData["degreeType"]) ||
                      null,
                  })
                }
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary
                  ${errors.degreeType ? "border-error" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              >
                <option value="">{t("degreeTypePlaceholder")}</option>
                {DEGREE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {tOptions(`degreeTypes.${option.value}`)}
                  </option>
                ))}
              </select>
              {errors.degreeType && (
                <p className="text-error text-sm mt-1">{errors.degreeType}</p>
              )}
            </div>

            {/* Specialization */}
            <div>
              <label
                htmlFor="specialization"
                className="block text-sm font-medium text-primary mb-1"
              >
                {t("specialization")}
              </label>
              <input
                type="text"
                id="specialization"
                value={data.specialization}
                onChange={(e) => onUpdate({ specialization: e.target.value })}
                placeholder={t("specializationPlaceholder")}
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.specialization ? "border-error" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.specialization && (
                <p className="text-error text-sm mt-1">
                  {errors.specialization}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        canGoNext={canGoNext}
        isOptionalStep={true}
      />
    </div>
  );
};
