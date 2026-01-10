'use client';

import { useTutorRegistration } from '../hooks/useTutorRegistration';
import { ProgressIndicator } from './ProgressIndicator';
import { AboutStep } from './steps/AboutStep';
import { PhotoStep } from './steps/PhotoStep';
import { EducationStep } from './steps/EducationStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { VideoStep } from './steps/VideoStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { PricingStep } from './steps/PricingStep';

export const TutorRegistration = () => {
  const {
    currentStep,
    maxReachedStepIndex,
    formData,
    stepStatuses,
    errors,
    isSubmitting,
    goToStep,
    goToNextStep,
    goToPrevStep,
    skipStep,
    canGoNext,
    isLastStep,
    submitRegistration,
    updateAboutData,
    updatePhotoData,
    updateEducationData,
    updateDescriptionData,
    updateVideoData,
    updateAvailabilityData,
    updatePricingData,
  } = useTutorRegistration();

  const handleNext = () => {
    if (isLastStep) {
      submitRegistration();
    } else {
      goToNextStep();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'about':
        return (
          <AboutStep
            data={formData.about}
            errors={errors}
            onUpdate={updateAboutData}
            onNext={handleNext}
            canGoNext={canGoNext}
          />
        );
      case 'photo':
        return (
          <PhotoStep
            data={formData.photo}
            errors={errors}
            onUpdate={updatePhotoData}
            onNext={handleNext}
            onBack={goToPrevStep}
            canGoNext={canGoNext}
          />
        );
      case 'education':
        return (
          <EducationStep
            data={formData.education}
            errors={errors}
            onUpdate={updateEducationData}
            onNext={handleNext}
            onBack={goToPrevStep}
            onSkip={skipStep}
            canGoNext={canGoNext}
          />
        );
      case 'description':
        return (
          <DescriptionStep
            data={formData.description}
            errors={errors}
            onUpdate={updateDescriptionData}
            onNext={handleNext}
            onBack={goToPrevStep}
            canGoNext={canGoNext}
          />
        );
      case 'video':
        return (
          <VideoStep
            data={formData.video}
            errors={errors}
            onUpdate={updateVideoData}
            onNext={handleNext}
            onBack={goToPrevStep}
            onSkip={skipStep}
            canGoNext={canGoNext}
          />
        );
      case 'availability':
        return (
          <AvailabilityStep
            data={formData.availability}
            errors={errors}
            onUpdate={updateAvailabilityData}
            onNext={handleNext}
            onBack={goToPrevStep}
            canGoNext={canGoNext}
          />
        );
      case 'pricing':
        return (
          <PricingStep
            data={formData.pricing}
            errors={errors}
            onUpdate={updatePricingData}
            onNext={handleNext}
            onBack={goToPrevStep}
            canGoNext={canGoNext}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress indicator - fixed at top */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ProgressIndicator
            currentStep={currentStep}
            stepStatuses={stepStatuses}
            maxReachedStepIndex={maxReachedStepIndex}
            onStepClick={goToStep}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">{renderCurrentStep()}</main>
    </div>
  );
};
