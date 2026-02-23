import {
  PRICING_CONFIG,
  VALIDATION_CONFIG,
} from "@/features/shared/constants/options";
import type {
  AboutFormData,
  AvailabilityFormData,
  DescriptionFormData,
  PhotoFormData,
  PricingFormData,
  VideoFormData,
} from "../types/registration";

const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

const validatePhoneNumber = (phone: string): string | null => {
  if (!phone) return "Phone number is required";
  const digitsOnly = phone.replace(/[\s-]/g, "");
  if (!/^\d{7,15}$/.test(digitsOnly)) {
    return "Please enter a valid phone number";
  }
  return null;
};

const validateVideoUrl = (url: string): string | null => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    if (hostname === "youtube.com") {
      if (urlObj.searchParams.has("v")) return null;
      if (/^\/(embed|shorts|live)\/[a-zA-Z0-9_-]+/.test(urlObj.pathname)) {
        return null;
      }
    }

    if (hostname === "youtu.be" && urlObj.pathname.length > 1) {
      return null;
    }

    if (hostname === "vimeo.com" && /^\/\d+/.test(urlObj.pathname)) {
      return null;
    }

    return "Please enter a valid YouTube or Vimeo URL";
  } catch {
    return "Please enter a valid YouTube or Vimeo URL";
  }
};

export const validateAboutStep = (
  data: AboutFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.countryCode) errors.countryCode = "Country is required";

  const phoneError = validatePhoneNumber(data.phoneNumber);
  if (phoneError) errors.phoneNumber = phoneError;

  if (data.expertise.length === 0) {
    errors.expertise = "Please select at least one expertise";
  }

  const validLanguages = data.languages.filter((lang) => lang.languageCode);
  if (validLanguages.length === 0) {
    errors.languages = "Please add at least one language";
  }

  return errors;
};

export const validatePhotoStep = (
  data: PhotoFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.avatarUrl && !data.avatarFile) {
    errors.avatar = "Please upload a profile photo";
  }

  return errors;
};

export const validateEducationStep = (): Record<string, string> => {
  return {};
};

export const validateDescriptionStep = (
  data: DescriptionFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { introduction, workExperience, motivation, headline } =
    VALIDATION_CONFIG;

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
    errors.headline = "Headline is required";
  } else if (data.headline.length > headline.maxLength) {
    errors.headline = `Headline must be no more than ${headline.maxLength} characters`;
  }

  return errors;
};

export const validateVideoStep = (
  data: VideoFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const urlError = validateVideoUrl(data.videoUrl);
  if (urlError) errors.videoUrl = urlError;

  return errors;
};

export const validateAvailabilityStep = (
  data: AvailabilityFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.timezone) errors.timezone = "Please select a timezone";

  const enabledSlots = data.slots.filter((slot) => slot.isEnabled);
  if (enabledSlots.length === 0) {
    errors.slots = "Please set at least one available time slot";
  }

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
        : `End time must be after start time for slots ${invalidSlotIndices.join(
            ", "
          )}`;
  }

  return errors;
};

export const validatePricingStep = (
  data: PricingFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const { minRate, maxRate } = PRICING_CONFIG;

  if (!data.hourlyRate || data.hourlyRate < minRate) {
    errors.hourlyRate = `Minimum rate is $${minRate}`;
  } else if (data.hourlyRate > maxRate) {
    errors.hourlyRate = `Maximum rate is $${maxRate}`;
  }

  return errors;
};
