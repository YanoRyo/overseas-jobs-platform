// ========================================
// 登録ステップの状態管理
// ========================================
export type RegistrationStep =
  | 'about'
  | 'photo'
  | 'education'
  | 'description'
  | 'video'
  | 'availability'
  | 'pricing';

export type StepStatus = 'pending' | 'current' | 'completed' | 'skipped';

export type StepConfig = {
  id: RegistrationStep;
  label: string;
  isOptional: boolean;
};

export const REGISTRATION_STEPS: StepConfig[] = [
  { id: 'about', label: 'About', isOptional: false },
  { id: 'photo', label: 'Photo', isOptional: false },
  { id: 'education', label: 'Education', isOptional: true },
  { id: 'description', label: 'Description', isOptional: false },
  { id: 'video', label: 'Video', isOptional: true },
  { id: 'availability', label: 'Availability', isOptional: false },
  { id: 'pricing', label: 'Pricing', isOptional: false },
];

// ========================================
// 各ステップのフォームデータ
// ========================================

// Step 1: About
export type AboutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string; // ISO 3166-1 alpha-2
  phoneCountryCode: string; // 国際電話コード (+81 など)
  phoneNumber: string;
  expertise: string[]; // 専門分野（複数選択）
  languages: TutorLanguage[]; // 話せる言語（複数）
};

// Step 2: Photo
export type PhotoFormData = {
  avatarUrl: string | null;
  avatarFile: File | null; // アップロード用
};

// Step 3: Education (任意)
export type EducationFormData = {
  hasNoDegree: boolean; // 学位なしチェック
  university: string;
  degree: string;
  degreeType: DegreeType | null;
  specialization: string;
};

export type DegreeType =
  | 'bachelor'
  | 'master'
  | 'doctorate'
  | 'associate'
  | 'diploma';

// Step 4: Description
export type DescriptionFormData = {
  introduction: string; // 100-1000文字
  workExperience: string; // 50文字以上
  motivation: string; // 50文字以上
  headline: string; // 最大100文字
};

// Step 5: Video (任意)
export type VideoFormData = {
  videoUrl: string; // YouTube/Vimeo URL
};

// Step 6: Availability
export type AvailabilityFormData = {
  timezone: string; // IANA timezone (Asia/Tokyo など)
  slots: AvailabilitySlot[];
};

export type AvailabilitySlot = {
  id: string; // クライアント側の一時ID
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm 形式
  endTime: string; // HH:mm 形式
  isEnabled: boolean;
};

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 日〜土

// Step 7: Pricing
export type PricingFormData = {
  hourlyRate: number; // USD, $10-$200
};

// ========================================
// 1対多の関連データ
// ========================================
export type TutorLanguage = {
  id: string; // クライアント側の一時ID
  languageCode: string; // ISO 639-1 (ja, en, zh など)
  languageName: string; // 表示用名前
  proficiencyLevel: LanguageProficiency;
};

export type LanguageProficiency =
  | 'native'
  | 'c2'
  | 'c1'
  | 'b2'
  | 'b1'
  | 'a2'
  | 'a1';

// ========================================
// 全体のフォームデータ（統合型）
// ========================================
export type TutorRegistrationFormData = {
  about: AboutFormData;
  photo: PhotoFormData;
  education: EducationFormData;
  description: DescriptionFormData;
  video: VideoFormData;
  availability: AvailabilityFormData;
  pricing: PricingFormData;
};

// ========================================
// 初期値
// ========================================
export const initialAboutFormData: AboutFormData = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '',
  phoneCountryCode: '+81',
  phoneNumber: '',
  expertise: [],
  languages: [
    {
      id: 'initial-lang-1',
      languageCode: '',
      languageName: '',
      proficiencyLevel: 'b2',
    },
  ],
};

export const initialPhotoFormData: PhotoFormData = {
  avatarUrl: null,
  avatarFile: null,
};

export const initialEducationFormData: EducationFormData = {
  hasNoDegree: false,
  university: '',
  degree: '',
  degreeType: null,
  specialization: '',
};

export const initialDescriptionFormData: DescriptionFormData = {
  introduction: '',
  workExperience: '',
  motivation: '',
  headline: '',
};

export const initialVideoFormData: VideoFormData = {
  videoUrl: '',
};

export const initialAvailabilityFormData: AvailabilityFormData = {
  timezone: 'Asia/Tokyo',
  slots: [],
};

export const initialPricingFormData: PricingFormData = {
  hourlyRate: 30,
};

export const initialTutorRegistrationFormData: TutorRegistrationFormData = {
  about: initialAboutFormData,
  photo: initialPhotoFormData,
  education: initialEducationFormData,
  description: initialDescriptionFormData,
  video: initialVideoFormData,
  availability: initialAvailabilityFormData,
  pricing: initialPricingFormData,
};

// ========================================
// バリデーションエラー型
// ========================================
export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export type FormValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

// ========================================
// DB保存用モデル（将来の参考）
// ========================================
// TODO: DB連携時に以下のような正規化構造を採用
// - tutors テーブル: 基本情報
// - tutor_languages テーブル: 言語（1対多）
// - tutor_expertise テーブル: 専門分野（1対多）
// - tutor_availability テーブル: 稼働時間（1対多）
// - tutor_education テーブル: 学歴（1対多、複数学歴対応可）

export type TutorProfile = {
  id: string; // UUID
  userId: string; // auth.users.id との紐付け
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneCountryCode: string;
  phoneNumber: string;
  avatarUrl: string | null;
  introduction: string;
  workExperience: string;
  motivation: string;
  headline: string;
  videoUrl: string | null;
  timezone: string;
  hourlyRate: number;
  // 学歴
  education: {
    hasNoDegree: boolean;
    university: string | null;
    degree: string | null;
    degreeType: DegreeType | null;
    specialization: string | null;
  } | null;
  // 1対多（正規化対象）
  languages: TutorLanguage[];
  expertise: string[];
  availability: AvailabilitySlot[];
  // メタデータ
  createdAt: string;
  updatedAt: string;
};
