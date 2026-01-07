'use client';

type StepNavigationProps = {
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastStep?: boolean;
  isOptionalStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
};

export const StepNavigation = ({
  onBack,
  onNext,
  onSkip,
  canGoBack = true,
  canGoNext = true,
  isLastStep = false,
  isOptionalStep = false,
  isSubmitting = false,
  nextLabel,
}: StepNavigationProps) => {
  const getNextButtonLabel = () => {
    if (nextLabel) return nextLabel;
    if (isLastStep) return 'Complete registration';
    return 'Save and continue';
  };

  return (
    <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
      {/* Left side - Back button */}
      <div>
        {canGoBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="
              px-6 py-3 rounded-lg font-medium
              border border-border text-primary
              hover:bg-surface-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Back
          </button>
        )}
      </div>

      {/* Right side - Skip and Next buttons */}
      <div className="flex items-center gap-3">
        {isOptionalStep && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="
              px-6 py-3 rounded-lg font-medium
              text-muted hover:text-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Skip
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className="
            px-6 py-3 rounded-lg font-medium
            bg-accent text-white
            hover:bg-accent-hover
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Submitting...' : getNextButtonLabel()}
        </button>
      </div>
    </div>
  );
};
