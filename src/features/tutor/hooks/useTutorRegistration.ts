'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  type RegistrationStep,
  type StepStatus,
  type TutorRegistrationFormData,
  type AboutFormData,
  type PhotoFormData,
  type EducationFormData,
  type DescriptionFormData,
  type VideoFormData,
  type AvailabilityFormData,
  type PricingFormData,
  REGISTRATION_STEPS,
  initialTutorRegistrationFormData,
} from '../types/registration';
import { VALIDATION_CONFIG, PRICING_CONFIG } from '../constants/options';

// ========================================
// バリデーション関数
// ========================================

const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

const validatePhoneNumber = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  // 数字のみ許可（ハイフンやスペースは除去後）
  const digitsOnly = phone.replace(/[\s-]/g, '');
  if (!/^\d{7,15}$/.test(digitsOnly)) return 'Please enter a valid phone number';
  return null;
};

const validateVideoUrl = (url: string): string | null => {
  if (!url) return null; // 任意項目

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    // YouTube: youtube.com または youtu.be
    if (hostname === 'youtube.com') {
      // /watch?v=VIDEO_ID
      if (urlObj.searchParams.has('v')) return null;
      // /embed/VIDEO_ID, /shorts/VIDEO_ID, /live/VIDEO_ID
      if (/^\/(embed|shorts|live)\/[a-zA-Z0-9_-]+/.test(urlObj.pathname)) return null;
    }
    if (hostname === 'youtu.be' && urlObj.pathname.length > 1) {
      return null;
    }

    // Vimeo: vimeo.com
    if (hostname === 'vimeo.com' && /^\/\d+/.test(urlObj.pathname)) {
      return null;
    }

    return 'Please enter a valid YouTube or Vimeo URL';
  } catch {
    return 'Please enter a valid YouTube or Vimeo URL';
  }
};

export const validateAboutStep = (data: AboutFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.lastName.trim()) errors.lastName = 'Last name is required';

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.countryCode) errors.countryCode = 'Country is required';

  const phoneError = validatePhoneNumber(data.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;

  if (data.expertise.length === 0) errors.expertise = 'Please select at least one expertise';
  if (data.languages.length === 0) errors.languages = 'Please add at least one language';

  return errors;
};

export const validatePhotoStep = (data: PhotoFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.avatarUrl && !data.avatarFile) {
    errors.avatar = 'Please upload a profile photo';
  }

  return errors;
};

export const validateEducationStep = (): Record<string, string> => {
  // 任意ステップなのでバリデーションなし
  return {};
};

export const validateDescriptionStep = (data: DescriptionFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { introduction, workExperience, motivation, headline } = VALIDATION_CONFIG;

  if (data.introduction.length < introduction.minLength) {
    errors.introduction = `Introduction must be at least ${introduction.minLength} characters`;
  } else if (data.introduction.length > introduction.maxLength) {
    errors.introduction = `Introduction must be no more than ${introduction.maxLength} characters`;
  }

  if (data.workExperience.length < workExperience.minLength) {
    errors.workExperience = `Work experience must be at least ${workExperience.minLength} characters`;
  } else if (data.workExperience.length > workExperience.maxLength) {
    errors.workExperience = `Work experience must be no more than ${workExperience.maxLength} characters`;
  }

  if (data.motivation.length < motivation.minLength) {
    errors.motivation = `Motivation must be at least ${motivation.minLength} characters`;
  } else if (data.motivation.length > motivation.maxLength) {
    errors.motivation = `Motivation must be no more than ${motivation.maxLength} characters`;
  }

  if (!data.headline.trim()) {
    errors.headline = 'Headline is required';
  } else if (data.headline.length > headline.maxLength) {
    errors.headline = `Headline must be no more than ${headline.maxLength} characters`;
  }

  return errors;
};

export const validateVideoStep = (data: VideoFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const urlError = validateVideoUrl(data.videoUrl);
  if (urlError) errors.videoUrl = urlError;

  return errors;
};

export const validateAvailabilityStep = (data: AvailabilityFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.timezone) errors.timezone = 'Please select a timezone';

  const enabledSlots = data.slots.filter((slot) => slot.isEnabled);
  if (enabledSlots.length === 0) {
    errors.slots = 'Please set at least one available time slot';
  }

  // 各スロットの時間チェック（複数エラーを収集）
  const invalidSlotIndices: number[] = [];
  enabledSlots.forEach((slot, index) => {
    if (slot.startTime >= slot.endTime) {
      invalidSlotIndices.push(index + 1);
    }
  });

  if (invalidSlotIndices.length > 0) {
    errors.slots =
      invalidSlotIndices.length === 1
        ? `End time must be after start time for slot ${invalidSlotIndices[0]}`
        : `End time must be after start time for slots ${invalidSlotIndices.join(', ')}`;
  }

  return errors;
};

export const validatePricingStep = (data: PricingFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { minRate, maxRate } = PRICING_CONFIG;

  if (!data.hourlyRate || data.hourlyRate < minRate) {
    errors.hourlyRate = `Minimum rate is $${minRate}`;
  } else if (data.hourlyRate > maxRate) {
    errors.hourlyRate = `Maximum rate is $${maxRate}`;
  }

  return errors;
};

// ========================================
// メインフック
// ========================================

export type UseTutorRegistrationReturn = {
  // 状態
  currentStep: RegistrationStep;
  currentStepIndex: number;
  maxReachedStepIndex: number;
  formData: TutorRegistrationFormData;
  stepStatuses: Record<RegistrationStep, StepStatus>;
  errors: Record<string, string>;
  isSubmitting: boolean;

  // ナビゲーション
  goToStep: (step: RegistrationStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  skipStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;

  // フォームデータ更新
  updateAboutData: (data: Partial<AboutFormData>) => void;
  updatePhotoData: (data: Partial<PhotoFormData>) => void;
  updateEducationData: (data: Partial<EducationFormData>) => void;
  updateDescriptionData: (data: Partial<DescriptionFormData>) => void;
  updateVideoData: (data: Partial<VideoFormData>) => void;
  updateAvailabilityData: (data: Partial<AvailabilityFormData>) => void;
  updatePricingData: (data: Partial<PricingFormData>) => void;

  // バリデーション
  validateCurrentStep: () => boolean;
  clearErrors: () => void;

  // 送信
  submitRegistration: () => Promise<void>;
};

export const useTutorRegistration = (): UseTutorRegistrationReturn => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);
  const [formData, setFormData] = useState<TutorRegistrationFormData>(
    initialTutorRegistrationFormData
  );
  const [stepStatuses, setStepStatuses] = useState<Record<RegistrationStep, StepStatus>>({
    about: 'current',
    photo: 'pending',
    education: 'pending',
    description: 'pending',
    video: 'pending',
    availability: 'pending',
    pricing: 'pending',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = REGISTRATION_STEPS[currentStepIndex].id;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === REGISTRATION_STEPS.length - 1;
  const canGoPrev = !isFirstStep;

  // 現在のステップのバリデーション結果を取得
  const currentStepErrors = useMemo((): Record<string, string> => {
    switch (currentStep) {
      case 'about':
        return validateAboutStep(formData.about);
      case 'photo':
        return validatePhotoStep(formData.photo);
      case 'education':
        return validateEducationStep();
      case 'description':
        return validateDescriptionStep(formData.description);
      case 'video':
        return validateVideoStep(formData.video);
      case 'availability':
        return validateAvailabilityStep(formData.availability);
      case 'pricing':
        return validatePricingStep(formData.pricing);
      default:
        return {};
    }
  }, [currentStep, formData]);

  // 現在のステップのバリデーション（エラーをstateにセットして結果を返す）
  const validateCurrentStep = useCallback((): boolean => {
    setErrors(currentStepErrors);
    return Object.keys(currentStepErrors).length === 0;
  }, [currentStepErrors]);

  // 次へ進めるかどうか（バリデーション結果に基づく）
  const canGoNext = useMemo(() => {
    // 任意ステップは常に次へ進める
    const currentConfig = REGISTRATION_STEPS[currentStepIndex];
    if (currentConfig.isOptional) return true;

    // バリデーションエラーがなければ次へ進める
    return Object.keys(currentStepErrors).length === 0;
  }, [currentStepIndex, currentStepErrors]);

  // ステップ遷移
  const goToStep = useCallback((step: RegistrationStep) => {
    const index = REGISTRATION_STEPS.findIndex((s) => s.id === step);
    if (index !== -1) {
      setCurrentStepIndex(index);
      // completed/skipped ステータスは保持する（クリックで戻れるように）
      setStepStatuses((prev) => {
        if (prev[step] === 'completed' || prev[step] === 'skipped') {
          return prev;
        }
        return {
          ...prev,
          [step]: 'current',
        };
      });
      setErrors({});
    }
  }, []);

  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    // 現在のステップを完了に
    setStepStatuses((prev) => ({
      ...prev,
      [currentStep]: 'completed',
    }));

    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = REGISTRATION_STEPS[nextIndex].id;
      setCurrentStepIndex(nextIndex);
      // 最大到達ステップを更新
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
      setStepStatuses((prev) => ({
        ...prev,
        [nextStep]: 'current',
      }));
      setErrors({});
    }
  }, [currentStep, currentStepIndex, isLastStep, validateCurrentStep]);

  const goToPrevStep = useCallback(() => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = REGISTRATION_STEPS[prevIndex].id;
      setCurrentStepIndex(prevIndex);
      setStepStatuses((prev) => {
        const currentStatus = prev[currentStep];
        return {
          ...prev,
          // completed/skipped状態を保持、それ以外はpendingに
          [currentStep]:
            currentStatus === 'completed' || currentStatus === 'skipped'
              ? currentStatus
              : 'pending',
          [prevStep]: 'current',
        };
      });
      setErrors({});
    }
  }, [currentStep, currentStepIndex, isFirstStep]);

  const skipStep = useCallback(() => {
    const currentConfig = REGISTRATION_STEPS[currentStepIndex];
    if (!currentConfig.isOptional) return;

    setStepStatuses((prev) => ({
      ...prev,
      [currentStep]: 'skipped',
    }));

    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = REGISTRATION_STEPS[nextIndex].id;
      setCurrentStepIndex(nextIndex);
      // 最大到達ステップを更新
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
      setStepStatuses((prev) => ({
        ...prev,
        [nextStep]: 'current',
      }));
      setErrors({});
    }
  }, [currentStep, currentStepIndex, isLastStep]);

  // フォームデータ更新関数
  const updateAboutData = useCallback((data: Partial<AboutFormData>) => {
    setFormData((prev) => ({
      ...prev,
      about: { ...prev.about, ...data },
    }));
  }, []);

  const updatePhotoData = useCallback((data: Partial<PhotoFormData>) => {
    setFormData((prev) => ({
      ...prev,
      photo: { ...prev.photo, ...data },
    }));
  }, []);

  const updateEducationData = useCallback((data: Partial<EducationFormData>) => {
    setFormData((prev) => ({
      ...prev,
      education: { ...prev.education, ...data },
    }));
  }, []);

  const updateDescriptionData = useCallback((data: Partial<DescriptionFormData>) => {
    setFormData((prev) => ({
      ...prev,
      description: { ...prev.description, ...data },
    }));
  }, []);

  const updateVideoData = useCallback((data: Partial<VideoFormData>) => {
    setFormData((prev) => ({
      ...prev,
      video: { ...prev.video, ...data },
    }));
  }, []);

  const updateAvailabilityData = useCallback((data: Partial<AvailabilityFormData>) => {
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, ...data },
    }));
  }, []);

  const updatePricingData = useCallback((data: Partial<PricingFormData>) => {
    setFormData((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, ...data },
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // 登録送信
  const submitRegistration = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      // TODO: 登録完了後のリダイレクト先を実装
      // 開発環境のみコンソールにデータを出力
      if (process.env.NODE_ENV === 'development') {
        console.log('Registration data:', formData);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep]);

  return {
    // 状態
    currentStep,
    currentStepIndex,
    maxReachedStepIndex,
    formData,
    stepStatuses,
    errors,
    isSubmitting,

    // ナビゲーション
    goToStep,
    goToNextStep,
    goToPrevStep,
    skipStep,
    canGoNext,
    canGoPrev,
    isLastStep,
    isFirstStep,

    // フォームデータ更新
    updateAboutData,
    updatePhotoData,
    updateEducationData,
    updateDescriptionData,
    updateVideoData,
    updateAvailabilityData,
    updatePricingData,

    // バリデーション
    validateCurrentStep,
    clearErrors,

    // 送信
    submitRegistration,
  };
};
