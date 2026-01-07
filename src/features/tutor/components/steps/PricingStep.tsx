'use client';

import { Info, DollarSign } from 'lucide-react';
import type { PricingFormData } from '../../types/registration';
import { PRICING_CONFIG } from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

type PricingStepProps = {
  data: PricingFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<PricingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
  isSubmitting: boolean;
};

export const PricingStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  canGoNext,
  isSubmitting,
}: PricingStepProps) => {
  const { minRate, maxRate, sessionDuration } = PRICING_CONFIG;

  const handleRateChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onUpdate({ hourlyRate: numValue });
    } else if (value === '') {
      onUpdate({ hourlyRate: 0 });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Set your {sessionDuration} minute lesson price
        </h1>
        <p className="text-secondary mt-2">Price in USD only</p>
      </div>

      {/* Price input */}
      <div className="max-w-md">
        <label htmlFor="hourlyRate" className="block text-sm font-medium text-primary mb-2">
          Session price <span className="text-error">*</span>
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="w-5 h-5 text-muted" />
          </div>
          <input
            type="number"
            id="hourlyRate"
            value={data.hourlyRate || ''}
            onChange={(e) => handleRateChange(e.target.value)}
            min={minRate}
            max={maxRate}
            step={1}
            className={`
              w-full border rounded-lg pl-10 pr-16 py-3 text-lg bg-surface text-primary placeholder:text-muted
              ${errors.hourlyRate ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.hourlyRate}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-muted">USD</span>
          </div>
        </div>

        <p className="text-sm text-muted mt-2">
          Minimum: ${minRate} — Maximum: ${maxRate}
        </p>

        {errors.hourlyRate && <p className="text-error text-sm mt-2">{errors.hourlyRate}</p>}
      </div>

      {/* Platform commission info */}
      <div className="max-w-2xl">
        <div className="flex items-start gap-3 p-4 bg-surface border border-border rounded-lg">
          <Info className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
          <div className="text-sm text-secondary">
            <p className="font-medium text-primary mb-2">Platform commission</p>
            <p>
              Our platform takes a small commission from each session to cover operational costs and
              continue improving the service. The exact commission rate will be displayed in your
              dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Price preview */}
      {data.hourlyRate > 0 && (
        <div className="max-w-md p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm text-secondary mb-1">Students will see:</p>
          <p className="text-2xl font-bold text-primary">
            ${data.hourlyRate}
            <span className="text-base font-normal text-muted"> / {sessionDuration} min</span>
          </p>
        </div>
      )}

      {/* Navigation */}
      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        canGoNext={canGoNext}
        isLastStep={true}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
