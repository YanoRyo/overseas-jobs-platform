import type {
  DayOfWeek,
  DegreeType,
  LanguageProficiency,
} from "@/features/mentor/types/registration";

export type MentorSettingsSection =
  | "about"
  | "photo"
  | "education"
  | "description"
  | "video"
  | "availability"
  | "pricing";

export type MentorSettingsLanguage = {
  id: string;
  languageCode: string;
  languageName: string;
  proficiencyLevel: LanguageProficiency;
};

export type MentorSettingsAvailabilitySlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

export type MentorSettingsAboutForm = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneCountryCode: string;
  phoneNumber: string;
  expertise: string[];
  languages: MentorSettingsLanguage[];
};

export type MentorSettingsPhotoForm = {
  avatarUrl: string;
};

export type MentorSettingsEducationForm = {
  hasNoDegree: boolean;
  university: string;
  degree: string;
  degreeType: DegreeType | null;
  specialization: string;
};

export type MentorSettingsDescriptionForm = {
  introduction: string;
  workExperience: string;
  motivation: string;
  headline: string;
};

export type MentorSettingsVideoForm = {
  videoUrl: string;
};

export type MentorSettingsAvailabilityForm = {
  timezone: string;
  slots: MentorSettingsAvailabilitySlot[];
};

export type MentorSettingsPricingForm = {
  hourlyRate: number;
};

export type MentorSettingsFormData = {
  about: MentorSettingsAboutForm;
  photo: MentorSettingsPhotoForm;
  education: MentorSettingsEducationForm;
  description: MentorSettingsDescriptionForm;
  video: MentorSettingsVideoForm;
  availability: MentorSettingsAvailabilityForm;
  pricing: MentorSettingsPricingForm;
};

export const initialMentorSettingsFormData: MentorSettingsFormData = {
  about: {
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    phoneCountryCode: "",
    phoneNumber: "",
    expertise: [],
    languages: [
      {
        id: "initial-language",
        languageCode: "",
        languageName: "",
        proficiencyLevel: "b2",
      },
    ],
  },
  photo: {
    avatarUrl: "",
  },
  education: {
    hasNoDegree: false,
    university: "",
    degree: "",
    degreeType: null,
    specialization: "",
  },
  description: {
    introduction: "",
    workExperience: "",
    motivation: "",
    headline: "",
  },
  video: {
    videoUrl: "",
  },
  availability: {
    timezone: "",
    slots: [],
  },
  pricing: {
    hourlyRate: 0,
  },
};
