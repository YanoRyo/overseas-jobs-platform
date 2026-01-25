'use client';

import { Info } from 'lucide-react';
import type { EducationFormData } from '../../types/registration';
import { DEGREE_TYPE_OPTIONS } from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

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
  const showFields = !data.hasNoDegree;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Education</h1>
        <p className="text-secondary mt-2">
          Tell students more about the higher education that you&apos;ve completed or are working on
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          This step is optional. You can skip and add this information later from your profile
          settings.
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
          <span className="text-primary">I don&apos;t have a higher education degree</span>
        </label>

        {/* Education fields */}
        {showFields && (
          <div className="space-y-4">
            {/* University */}
            <div>
              <label htmlFor="university" className="block text-sm font-medium text-primary mb-1">
                University
              </label>
              <input
                type="text"
                id="university"
                value={data.university}
                onChange={(e) => onUpdate({ university: e.target.value })}
                placeholder="E.g. Mount Royal University"
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.university ? 'border-error' : 'border-border'}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.university && <p className="text-error text-sm mt-1">{errors.university}</p>}
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-primary mb-1">
                Degree
              </label>
              <input
                type="text"
                id="degree"
                value={data.degree}
                onChange={(e) => onUpdate({ degree: e.target.value })}
                placeholder="E.g. Bachelor's degree in the English Language"
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.degree ? 'border-error' : 'border-border'}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.degree && <p className="text-error text-sm mt-1">{errors.degree}</p>}
            </div>

            {/* Degree type */}
            <div>
              <label htmlFor="degreeType" className="block text-sm font-medium text-primary mb-1">
                Degree type
              </label>
              <select
                id="degreeType"
                value={data.degreeType || ''}
                onChange={(e) =>
                  onUpdate({
                    degreeType: (e.target.value as EducationFormData['degreeType']) || null,
                  })
                }
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary
                  ${errors.degreeType ? 'border-error' : 'border-border'}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              >
                <option value="">Choose degree type...</option>
                {DEGREE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.degreeType && <p className="text-error text-sm mt-1">{errors.degreeType}</p>}
            </div>

            {/* Specialization */}
            <div>
              <label
                htmlFor="specialization"
                className="block text-sm font-medium text-primary mb-1"
              >
                Specialization
              </label>
              <input
                type="text"
                id="specialization"
                value={data.specialization}
                onChange={(e) => onUpdate({ specialization: e.target.value })}
                placeholder="E.g. Teaching English as a Foreign Language"
                className={`
                  w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                  ${errors.specialization ? 'border-error' : 'border-border'}
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              />
              {errors.specialization && (
                <p className="text-error text-sm mt-1">{errors.specialization}</p>
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
