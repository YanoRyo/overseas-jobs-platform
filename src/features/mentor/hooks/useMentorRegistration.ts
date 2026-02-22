"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  type RegistrationStep,
  type StepStatus,
  type MentorRegistrationFormData,
  type AboutFormData,
  type PhotoFormData,
  type EducationFormData,
  type DescriptionFormData,
  type VideoFormData,
  type AvailabilityFormData,
  type PricingFormData,
  REGISTRATION_STEPS,
  initialMentorRegistrationFormData,
} from "../types/registration";
import {
  registerMentor,
  checkMentorExistsByUserId,
} from "@/lib/supabase/mentors";
import type { MentorInsert } from "@/lib/supabase/types";
import {
  validateAboutStep,
  validatePhotoStep,
  validateEducationStep,
  validateDescriptionStep,
  validateVideoStep,
  validateAvailabilityStep,
  validatePricingStep,
} from "../utils/validation";

// ========================================
// メインフック
// ========================================

export type UseMentorRegistrationReturn = {
  // 状態
  currentStep: RegistrationStep;
  currentStepIndex: number;
  maxReachedStepIndex: number;
  formData: MentorRegistrationFormData;
  stepStatuses: Record<RegistrationStep, StepStatus>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isCheckingRegistration: boolean;

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

export const useMentorRegistration = (): UseMentorRegistrationReturn => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);
  const [formData, setFormData] = useState<MentorRegistrationFormData>(
    initialMentorRegistrationFormData
  );
  const [stepStatuses, setStepStatuses] = useState<
    Record<RegistrationStep, StepStatus>
  >({
    about: "current",
    photo: "pending",
    education: "pending",
    description: "pending",
    video: "pending",
    availability: "pending",
    pricing: "pending",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  // 登録済みかどうかをチェック
  useEffect(() => {
    const checkRegistration = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsCheckingRegistration(false);
        return;
      }

      const exists = await checkMentorExistsByUserId(supabase, user.id);
      if (exists) {
        // TODO: 将来的にはプロフィール編集ページ(/mentor/profile/edit)にリダイレクトする
        router.push("/");
        return;
      }

      setIsCheckingRegistration(false);
    };

    checkRegistration();
  }, [supabase, router]);

  const currentStep = REGISTRATION_STEPS[currentStepIndex].id;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === REGISTRATION_STEPS.length - 1;
  const canGoPrev = !isFirstStep;

  // 現在のステップのバリデーション結果を取得
  const currentStepErrors = useMemo((): Record<string, string> => {
    switch (currentStep) {
      case "about":
        return validateAboutStep(formData.about);
      case "photo":
        return validatePhotoStep(formData.photo);
      case "education":
        return validateEducationStep();
      case "description":
        return validateDescriptionStep(formData.description);
      case "video":
        return validateVideoStep(formData.video);
      case "availability":
        return validateAvailabilityStep(formData.availability);
      case "pricing":
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
        if (prev[step] === "completed" || prev[step] === "skipped") {
          return prev;
        }
        return {
          ...prev,
          [step]: "current",
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
      [currentStep]: "completed",
    }));

    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = REGISTRATION_STEPS[nextIndex].id;
      setCurrentStepIndex(nextIndex);
      // 最大到達ステップを更新
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
      setStepStatuses((prev) => ({
        ...prev,
        [nextStep]: "current",
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
            currentStatus === "completed" || currentStatus === "skipped"
              ? currentStatus
              : "pending",
          [prevStep]: "current",
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
      [currentStep]: "skipped",
    }));

    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = REGISTRATION_STEPS[nextIndex].id;
      setCurrentStepIndex(nextIndex);
      // 最大到達ステップを更新
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
      setStepStatuses((prev) => ({
        ...prev,
        [nextStep]: "current",
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

  const updateEducationData = useCallback(
    (data: Partial<EducationFormData>) => {
      setFormData((prev) => ({
        ...prev,
        education: { ...prev.education, ...data },
      }));
    },
    []
  );

  const updateDescriptionData = useCallback(
    (data: Partial<DescriptionFormData>) => {
      setFormData((prev) => ({
        ...prev,
        description: { ...prev.description, ...data },
      }));
    },
    []
  );

  const updateVideoData = useCallback((data: Partial<VideoFormData>) => {
    setFormData((prev) => ({
      ...prev,
      video: { ...prev.video, ...data },
    }));
  }, []);

  const updateAvailabilityData = useCallback(
    (data: Partial<AvailabilityFormData>) => {
      setFormData((prev) => ({
        ...prev,
        availability: { ...prev.availability, ...data },
      }));
    },
    []
  );

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
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. ログインユーザー取得
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrors({ submit: "Please login to continue." });
        return;
      }

      // 2. formDataをDB保存用の形式に変換
      const mentorData: MentorInsert = {
        user_id: user.id,
        first_name: formData.about.firstName,
        last_name: formData.about.lastName,
        email: formData.about.email,
        country_code: formData.about.countryCode,
        phone_country_code: formData.about.phoneCountryCode,
        phone_number: formData.about.phoneNumber,
        avatar_url: null, // registerMentor内でアップロード後に設定
        introduction: formData.description.introduction,
        work_experience: formData.description.workExperience,
        motivation: formData.description.motivation,
        headline: formData.description.headline,
        video_url: formData.video.videoUrl || null,
        timezone: formData.availability.timezone,
        hourly_rate: formData.pricing.hourlyRate,
        has_no_degree: formData.education.hasNoDegree,
        university: formData.education.university || null,
        degree: formData.education.degree || null,
        degree_type: formData.education.degreeType,
        specialization: formData.education.specialization || null,
      };

      // 3. 言語データ
      const languages = formData.about.languages
        .filter((lang) => lang.languageCode)
        .map((lang) => ({
          language_code: lang.languageCode,
          language_name: lang.languageName,
          proficiency_level: lang.proficiencyLevel,
        }));

      // 4. 稼働時間データ
      const availability = formData.availability.slots
        .filter((slot) => slot.isEnabled)
        .map((slot) => ({
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_enabled: slot.isEnabled,
        }));

      // 5. DB保存
      const { error: registerError } = await registerMentor({
        supabaseClient: supabase,
        mentor: mentorData,
        languages,
        expertise: formData.about.expertise,
        availability,
        avatarFile: formData.photo.avatarFile,
      });

      if (registerError) {
        setErrors({ submit: "Registration failed. Please try again." });
        return;
      }

      // 6. 登録完了後のリダイレクト（トップページへ）
      router.push("/");
    } catch (error) {
      console.error("submitRegistration failed", error);
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateCurrentStep, router, supabase]);

  return {
    // 状態
    currentStep,
    currentStepIndex,
    maxReachedStepIndex,
    formData,
    stepStatuses,
    errors,
    isSubmitting,
    isCheckingRegistration,

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
