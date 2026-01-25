'use client';

import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useMentorRegistration } from '../hooks/useMentorRegistration';
import { useSignup } from '@/features/auth/hooks/useSignup';
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

  const {
    email,
    password,
    confirmPassword,
    loading: signupLoading,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleEmailSignup,
    handleGoogleSignup,
  } = useSignup();

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
      <Dialog
        open={isLoggedOut}
        onClose={() => router.push('/')}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <Dialog.Panel className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-primary">
              アカウント作成
            </Dialog.Title>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-muted hover:text-primary transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-secondary text-sm mb-6">
            メンター登録にはアカウントが必要です。
          </p>

          {/* Social signup */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-2 bg-white border border-border text-primary py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleで続ける
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-grow border-t border-border" />
            <span className="mx-4 text-muted text-sm">または</span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Email signup form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="メールアドレス"
                className="w-full border border-border rounded-lg p-3 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="パスワード"
                className="w-full border border-border rounded-lg p-3 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="パスワード（確認）"
                className="w-full border border-border rounded-lg p-3 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={signupLoading}
              className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {signupLoading ? '登録中...' : 'アカウント作成'}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-secondary">
            既にアカウントをお持ちの方は{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/login?redirect=/mentor/register')}
              className="text-accent hover:text-accent-hover underline font-medium transition-colors"
            >
              ログイン
            </button>
          </p>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};
