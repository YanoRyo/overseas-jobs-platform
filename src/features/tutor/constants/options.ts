import type { DegreeType, LanguageProficiency } from '../types/registration';

// TODO: 将来的にSupabaseのマスターテーブルから取得を検討
// 現在はハードコードで実装

// ========================================
// 国リスト (ISO 3166-1 alpha-2)
// ========================================
export type CountryOption = {
  code: string;
  name: string;
  phoneCode: string;
};

export const COUNTRIES: CountryOption[] = [
  { code: 'JP', name: 'Japan', phoneCode: '+81' },
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'IT', name: 'Italy', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', phoneCode: '+34' },
  { code: 'NL', name: 'Netherlands', phoneCode: '+31' },
  { code: 'KR', name: 'South Korea', phoneCode: '+82' },
  { code: 'CN', name: 'China', phoneCode: '+86' },
  { code: 'TW', name: 'Taiwan', phoneCode: '+886' },
  { code: 'HK', name: 'Hong Kong', phoneCode: '+852' },
  { code: 'SG', name: 'Singapore', phoneCode: '+65' },
  { code: 'IN', name: 'India', phoneCode: '+91' },
  { code: 'PH', name: 'Philippines', phoneCode: '+63' },
  { code: 'TH', name: 'Thailand', phoneCode: '+66' },
  { code: 'VN', name: 'Vietnam', phoneCode: '+84' },
  { code: 'MY', name: 'Malaysia', phoneCode: '+60' },
  { code: 'ID', name: 'Indonesia', phoneCode: '+62' },
  { code: 'BR', name: 'Brazil', phoneCode: '+55' },
  { code: 'MX', name: 'Mexico', phoneCode: '+52' },
  { code: 'RU', name: 'Russia', phoneCode: '+7' },
  { code: 'UA', name: 'Ukraine', phoneCode: '+380' },
  { code: 'PL', name: 'Poland', phoneCode: '+48' },
  { code: 'SE', name: 'Sweden', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', phoneCode: '+358' },
  { code: 'NZ', name: 'New Zealand', phoneCode: '+64' },
  { code: 'IE', name: 'Ireland', phoneCode: '+353' },
  { code: 'CH', name: 'Switzerland', phoneCode: '+41' },
  { code: 'AT', name: 'Austria', phoneCode: '+43' },
  { code: 'BE', name: 'Belgium', phoneCode: '+32' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351' },
  { code: 'ZA', name: 'South Africa', phoneCode: '+27' },
  { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'IL', name: 'Israel', phoneCode: '+972' },
  { code: 'TR', name: 'Turkey', phoneCode: '+90' },
];

// ========================================
// 言語リスト (ISO 639-1)
// ========================================
export type LanguageOption = {
  code: string;
  name: string;
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'uk', name: 'Ukrainian' },
];

// ========================================
// 言語レベル (CEFR基準)
// ========================================
export type LanguageProficiencyOption = {
  value: LanguageProficiency;
  label: string;
  description: string;
};

export const LANGUAGE_PROFICIENCY_OPTIONS: LanguageProficiencyOption[] = [
  { value: 'native', label: 'Native', description: 'Native speaker' },
  { value: 'c2', label: 'C2', description: 'Proficient - Mastery' },
  { value: 'c1', label: 'C1', description: 'Advanced - Effective operational proficiency' },
  { value: 'b2', label: 'B2', description: 'Upper intermediate - Vantage' },
  { value: 'b1', label: 'B1', description: 'Intermediate - Threshold' },
  { value: 'a2', label: 'A2', description: 'Elementary - Waystage' },
  { value: 'a1', label: 'A1', description: 'Beginner - Breakthrough' },
];

// ========================================
// 専門分野
// ========================================
export type ExpertiseOption = {
  value: string;
  label: string;
};

export const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'web_development', label: 'Web Development' },
  { value: 'mobile_development', label: 'Mobile Development' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'machine_learning', label: 'Machine Learning / AI' },
  { value: 'cloud_computing', label: 'Cloud Computing' },
  { value: 'devops', label: 'DevOps' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'product_management', label: 'Product Management' },
  { value: 'ui_ux_design', label: 'UI/UX Design' },
  { value: 'business_strategy', label: 'Business Strategy' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'career_coaching', label: 'Career Coaching' },
  { value: 'interview_prep', label: 'Interview Preparation' },
  { value: 'language_learning', label: 'Language Learning' },
  { value: 'startup', label: 'Startup / Entrepreneurship' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication Skills' },
];

// ========================================
// 学位タイプ
// ========================================
export type DegreeTypeOption = {
  value: DegreeType;
  label: string;
};

export const DEGREE_TYPE_OPTIONS: DegreeTypeOption[] = [
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate (Ph.D.)' },
  { value: 'diploma', label: 'Diploma / Certificate' },
];

// ========================================
// タイムゾーン (IANA)
// ========================================
export type TimezoneOption = {
  value: string;
  label: string;
  offset: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: 'UTC-10' },
  { value: 'America/Anchorage', label: 'Alaska (AKST)', offset: 'UTC-9' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST)', offset: 'UTC-8' },
  { value: 'America/Denver', label: 'Mountain Time (MST)', offset: 'UTC-7' },
  { value: 'America/Chicago', label: 'Central Time (CST)', offset: 'UTC-6' },
  { value: 'America/New_York', label: 'Eastern Time (EST)', offset: 'UTC-5' },
  { value: 'America/Sao_Paulo', label: 'Brasilia (BRT)', offset: 'UTC-3' },
  { value: 'Atlantic/Reykjavik', label: 'Iceland (GMT)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 'UTC+1' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 'UTC+4' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: 'UTC+7' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: 'UTC+8' },
  { value: 'Asia/Shanghai', label: 'China (CST)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)', offset: 'UTC+9' },
  { value: 'Asia/Seoul', label: 'Korea (KST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)', offset: 'UTC+12' },
];

// ========================================
// 曜日
// ========================================
export type DayOfWeekOption = {
  value: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  shortLabel: string;
};

export const DAY_OF_WEEK_OPTIONS: DayOfWeekOption[] = [
  { value: 0, label: 'Sunday', shortLabel: 'Sun' },
  { value: 1, label: 'Monday', shortLabel: 'Mon' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 4, label: 'Thursday', shortLabel: 'Thu' },
  { value: 5, label: 'Friday', shortLabel: 'Fri' },
  { value: 6, label: 'Saturday', shortLabel: 'Sat' },
];

// ========================================
// 時間帯オプション (30分刻み)
// ========================================
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

// ========================================
// 料金設定
// ========================================
export const PRICING_CONFIG = {
  minRate: 10,
  maxRate: 200,
  currency: 'USD',
  sessionDuration: 50, // minutes
} as const;

// ========================================
// バリデーション設定
// ========================================
export const VALIDATION_CONFIG = {
  introduction: {
    minLength: 100,
    maxLength: 1000,
  },
  workExperience: {
    minLength: 50,
    maxLength: 400,
  },
  motivation: {
    minLength: 50,
    maxLength: 400,
  },
  headline: {
    maxLength: 100,
  },
} as const;

// ========================================
// 写真要件
// ========================================
export const PHOTO_REQUIREMENTS = [
  'You should be facing forward',
  'Frame your head and shoulders',
  'You should be centered and upright',
  'Your face and eyes should be visible (except for religious reasons)',
  'You should be the only person in the photo',
  'Use a color photo with high resolution and no filters',
  'Avoid logos or contact information',
] as const;

// ========================================
// 動画要件
// ========================================
export const VIDEO_REQUIREMENTS = {
  do: [
    'Your video should be between 30 seconds and 2 minutes long',
    'Record in horizontal mode and at eye level',
    'Use good lighting and a neutral background',
    'Use a stable surface so that your video does not appear shaky',
    'Make sure your face and eyes are fully visible (except for religious reasons)',
    'Highlight your teaching experience and any relevant certifications',
    'Greet your students warmly and invite them to book a lesson',
  ],
  dont: [
    'Include your surname or any contact details',
    'Include logos or links',
    'Use slideshows or presentations',
    'Have any other people visible in your video',
  ],
} as const;
