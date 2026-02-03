'use client';

import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { useMentorRegistration } from '../hooks/useMentorRegistration';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { ProgressIndicator } from './ProgressIndicator';
import { AboutStep } from './steps/AboutStep';
import { PhotoStep } from './steps/PhotoStep';
import { EducationStep } from './steps/EducationStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { VideoStep } from './steps/VideoStep';
import { AvailabilityStep } from './steps/AvailabilityStep';
import { PricingStep } from './steps/PricingStep';

export const MentorRegistration = () => {
  const user = useUser();
  const router = useRouter();

  const {
    currentStep,
    maxReachedStepIndex,
    formData,
    stepStatuses,
    errors,
    isSubmitting,
    isCheckingRegistration,
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
  } = useMentorRegistration();

  // 未ログインの場合、サインアップモーダルを表示
  const isLoggedOut = !user;

  // 登録済みチェック中はローディング表示
  if (isCheckingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

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

      {/* Signup modal for unauthenticated users */}
      <AuthModal
        open={isLoggedOut}
        onClose={() => router.push('/')}
        initialRole="mentor"
        title="Create your account"
        description="An account is required to register as a mentor."
        redirectOnClose="/"
      />
    </div>
  );
};
