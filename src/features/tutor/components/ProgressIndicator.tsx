'use client';

import { Check, ChevronRight } from 'lucide-react';
import type { RegistrationStep, StepStatus } from '../types/registration';
import { REGISTRATION_STEPS } from '../types/registration';

type ProgressIndicatorProps = {
  currentStep: RegistrationStep;
  stepStatuses: Record<RegistrationStep, StepStatus>;
  maxReachedStepIndex: number;
  onStepClick?: (step: RegistrationStep) => void;
};

export const ProgressIndicator = ({
  currentStep,
  stepStatuses,
  maxReachedStepIndex,
  onStepClick,
}: ProgressIndicatorProps) => {
  const currentIndex = REGISTRATION_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Registration progress" className="w-full">
      {/* Desktop view */}
      <ol className="hidden md:flex items-center justify-center">
        {REGISTRATION_STEPS.map((step, index) => {
          const status = stepStatuses[step.id];
          const isCurrent = step.id === currentStep;
          // 完了/スキップ済み、または到達済みのステップはクリック可能
          const isClickable =
            status === 'completed' || status === 'skipped' || index <= maxReachedStepIndex;

          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isClickable && !isCurrent && onStepClick?.(step.id)}
                disabled={!isClickable || isCurrent}
                className={`
                  flex items-center gap-2 py-2 px-1 rounded-lg font-medium
                  ${isClickable && !isCurrent ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-default'}
                  ${isCurrent ? 'text-accent' : ''}
                  ${!isCurrent && status === 'pending' ? 'text-muted' : ''}
                  ${!isCurrent && (status === 'completed' || status === 'skipped') ? 'text-primary' : ''}
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Step indicator */}
                <span
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium border flex-shrink-0
                    ${status === 'completed' && !isCurrent ? 'bg-accent text-white border-accent' : ''}
                    ${status === 'skipped' && !isCurrent ? 'bg-muted text-white border-muted' : ''}
                    ${isCurrent ? 'bg-accent text-white border-accent' : ''}
                    ${status === 'pending' && !isCurrent ? 'bg-surface border-border text-muted' : ''}
                  `}
                >
                  {status === 'completed' && !isCurrent ? (
                    <Check className="w-4 h-4" />
                  ) : status === 'skipped' && !isCurrent ? (
                    <span className="text-xs">-</span>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Step label */}
                <span className="hidden lg:inline text-sm whitespace-nowrap">{step.label}</span>
              </button>

              {/* Separator */}
              {index < REGISTRATION_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted flex-shrink-0 mx-2" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted">
            Step {currentIndex + 1} of {REGISTRATION_STEPS.length}
          </span>
          <span className="text-sm font-medium text-primary">
            {REGISTRATION_STEPS[currentIndex].label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / REGISTRATION_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {REGISTRATION_STEPS.map((step, index) => {
            const status = stepStatuses[step.id];
            const isCurrent = step.id === currentStep;
            // 完了/スキップ済み、または到達済みのステップはクリック可能
            const isClickable =
              status === 'completed' || status === 'skipped' || index <= maxReachedStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && !isCurrent && onStepClick?.(step.id)}
                disabled={!isClickable || isCurrent}
                className={`
                  w-3 h-3 rounded-full transition-colors
                  ${status === 'completed' && !isCurrent ? 'bg-accent' : ''}
                  ${status === 'skipped' && !isCurrent ? 'bg-muted' : ''}
                  ${isCurrent ? 'bg-accent' : ''}
                  ${status === 'pending' && !isCurrent ? 'bg-border' : ''}
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
                aria-label={`Step ${index + 1}: ${step.label}`}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
};
