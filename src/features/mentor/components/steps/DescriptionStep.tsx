'use client';

import { Info } from 'lucide-react';
import type { DescriptionFormData } from '../../types/registration';
import { VALIDATION_CONFIG } from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

type DescriptionStepProps = {
  data: DescriptionFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<DescriptionFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
};

export const DescriptionStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  canGoNext,
}: DescriptionStepProps) => {
  const { introduction, workExperience, motivation, headline } = VALIDATION_CONFIG;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Profile description</h1>
        <p className="text-secondary mt-2">
          This info will go on your public profile. Write it in the language you&apos;ll be
          teaching and make sure to follow our guidelines to get approved.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* 1. Introduce yourself */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-2">
            1. Introduce yourself <span className="text-error">*</span>
          </h2>
          <p className="text-secondary text-sm mb-3">
            Show potential students who you are! Share your teaching experience and passion for
            education and briefly mention your interests and hobbies.
          </p>

          <textarea
            value={data.introduction}
            onChange={(e) => onUpdate({ introduction: e.target.value })}
            rows={6}
            className={`
              w-full border rounded-lg px-3 py-2 resize-none bg-surface text-primary placeholder:text-muted
              ${errors.introduction ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.introduction}
          />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-start gap-2 flex-1">
              {errors.introduction ? (
                <p className="text-error text-sm">{errors.introduction}</p>
              ) : (
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Don&apos;t include your last name or present your information in a CV format
                  </p>
                </div>
              )}
            </div>
            <span
              className={`text-sm ml-4 ${
                data.introduction.length < introduction.minLength ||
                data.introduction.length > introduction.maxLength
                  ? 'text-error'
                  : 'text-muted'
              }`}
            >
              {data.introduction.length}/{introduction.maxLength}
            </span>
          </div>
        </div>

        {/* 2. Work experience */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-2">
            2. Work experience <span className="text-error">*</span>
          </h2>
          <p className="text-secondary text-sm mb-3">
            Describe your relevant work experience and achievements.
          </p>

          <textarea
            value={data.workExperience}
            onChange={(e) => onUpdate({ workExperience: e.target.value })}
            rows={4}
            className={`
              w-full border rounded-lg px-3 py-2 resize-none bg-surface text-primary placeholder:text-muted
              ${errors.workExperience ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.workExperience}
          />

          <div className="flex items-center justify-between mt-2">
            {errors.workExperience && (
              <p className="text-error text-sm">{errors.workExperience}</p>
            )}
            <span
              className={`text-sm ml-auto ${
                data.workExperience.length < workExperience.minLength ||
                data.workExperience.length > workExperience.maxLength
                  ? 'text-error'
                  : 'text-muted'
              }`}
            >
              {data.workExperience.length}/{workExperience.maxLength}
            </span>
          </div>
        </div>

        {/* 3. Motivate potential students */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-2">
            3. Motivate potential students <span className="text-error">*</span>
          </h2>
          <p className="text-secondary text-sm mb-3">
            Encourage potential students to book a session with you.
          </p>

          <textarea
            value={data.motivation}
            onChange={(e) => onUpdate({ motivation: e.target.value })}
            rows={4}
            className={`
              w-full border rounded-lg px-3 py-2 resize-none bg-surface text-primary placeholder:text-muted
              ${errors.motivation ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.motivation}
          />

          <div className="flex items-center justify-between mt-2">
            {errors.motivation && <p className="text-error text-sm">{errors.motivation}</p>}
            <span
              className={`text-sm ml-auto ${
                data.motivation.length < motivation.minLength ||
                data.motivation.length > motivation.maxLength
                  ? 'text-error'
                  : 'text-muted'
              }`}
            >
              {data.motivation.length}/{motivation.maxLength}
            </span>
          </div>
        </div>

        {/* 4. Write a catchy headline */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-2">
            4. Write a catchy headline <span className="text-error">*</span>
          </h2>
          <p className="text-secondary text-sm mb-3">
            This will be displayed prominently on your profile.
          </p>

          <input
            type="text"
            value={data.headline}
            onChange={(e) => onUpdate({ headline: e.target.value })}
            placeholder="E.g. Experienced software engineer helping you land your dream job"
            className={`
              w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
              ${errors.headline ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.headline}
          />

          <div className="flex items-center justify-between mt-2">
            {errors.headline && <p className="text-error text-sm">{errors.headline}</p>}
            <span
              className={`text-sm ml-auto ${
                data.headline.trim().length === 0 || data.headline.length > headline.maxLength
                  ? 'text-error'
                  : 'text-muted'
              }`}
            >
              {data.headline.length}/{headline.maxLength}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation onBack={onBack} onNext={onNext} canGoNext={canGoNext} />
    </div>
  );
};
