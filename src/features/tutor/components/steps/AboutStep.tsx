'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { AboutFormData, TutorLanguage, LanguageProficiency } from '../../types/registration';
import {
  COUNTRIES,
  LANGUAGES,
  LANGUAGE_PROFICIENCY_OPTIONS,
  EXPERTISE_OPTIONS,
} from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

type AboutStepProps = {
  data: AboutFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<AboutFormData>) => void;
  onNext: () => void;
  canGoNext: boolean;
};

// 定義済みオプションに含まれないカスタム値を取得
const getCustomExpertise = (expertise: string[]): string[] => {
  const predefinedValues = EXPERTISE_OPTIONS.map((opt) => opt.value);
  return expertise.filter((e) => !predefinedValues.includes(e));
};

export const AboutStep = ({ data, errors, onUpdate, onNext, canGoNext }: AboutStepProps) => {
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>(data.expertise);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInputValue, setOtherInputValue] = useState('');

  // 言語追加
  const addLanguage = useCallback(() => {
    const newLanguage: TutorLanguage = {
      id: crypto.randomUUID(),
      languageCode: '',
      languageName: '',
      proficiencyLevel: 'b2',
    };
    onUpdate({ languages: [...data.languages, newLanguage] });
  }, [data.languages, onUpdate]);

  // 言語削除
  const removeLanguage = useCallback(
    (id: string) => {
      onUpdate({ languages: data.languages.filter((lang) => lang.id !== id) });
    },
    [data.languages, onUpdate]
  );

  // 言語更新
  const updateLanguage = useCallback(
    (id: string, field: keyof TutorLanguage, value: string) => {
      const updatedLanguages = data.languages.map((lang) => {
        if (lang.id !== id) return lang;

        if (field === 'languageCode') {
          const selectedLang = LANGUAGES.find((l) => l.code === value);
          return {
            ...lang,
            languageCode: value,
            languageName: selectedLang?.name || '',
          };
        }

        return { ...lang, [field]: value };
      });
      onUpdate({ languages: updatedLanguages });
    },
    [data.languages, onUpdate]
  );

  // 専門分野の切り替え
  const toggleExpertise = useCallback(
    (value: string) => {
      const newExpertise = selectedExpertise.includes(value)
        ? selectedExpertise.filter((e) => e !== value)
        : [...selectedExpertise, value];
      setSelectedExpertise(newExpertise);
      onUpdate({ expertise: newExpertise });
    },
    [selectedExpertise, onUpdate]
  );

  // カスタムExpertiseを追加
  const addCustomExpertise = useCallback(() => {
    const trimmedValue = otherInputValue.trim();
    if (trimmedValue && !selectedExpertise.includes(trimmedValue)) {
      const newExpertise = [...selectedExpertise, trimmedValue];
      setSelectedExpertise(newExpertise);
      onUpdate({ expertise: newExpertise });
      setOtherInputValue('');
      setShowOtherInput(false);
    }
  }, [otherInputValue, selectedExpertise, onUpdate]);

  // カスタムExpertiseを削除
  const removeCustomExpertise = useCallback(
    (value: string) => {
      const newExpertise = selectedExpertise.filter((e) => e !== value);
      setSelectedExpertise(newExpertise);
      onUpdate({ expertise: newExpertise });
    },
    [selectedExpertise, onUpdate]
  );

  // Enterキーでカスタム追加
  const handleOtherInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomExpertise();
      } else if (e.key === 'Escape') {
        setShowOtherInput(false);
        setOtherInputValue('');
      }
    },
    [addCustomExpertise]
  );

  // カスタムExpertiseの一覧を取得
  const customExpertise = getCustomExpertise(selectedExpertise);

  // 国の変更時に電話コードも更新
  const handleCountryChange = useCallback(
    (countryCode: string) => {
      const country = COUNTRIES.find((c) => c.code === countryCode);
      onUpdate({
        countryCode,
        phoneCountryCode: country?.phoneCode || '',
      });
    },
    [onUpdate]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">About</h1>
        <p className="text-secondary mt-2">
          Start creating your public tutor profile. Your progress will be automatically saved as you
          complete each section.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-primary mb-1">
              First name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              className={`
                w-full border rounded-lg px-3 py-2 bg-surface text-primary
                placeholder:text-muted
                ${errors.firstName ? 'border-error' : 'border-border'}
                focus:outline-none focus:ring-2 focus:ring-accent
              `}
              aria-required="true"
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <p className="text-error text-sm mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-primary mb-1">
              Last name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              className={`
                w-full border rounded-lg px-3 py-2 bg-surface text-primary
                placeholder:text-muted
                ${errors.lastName ? 'border-error' : 'border-border'}
                focus:outline-none focus:ring-2 focus:ring-accent
              `}
              aria-required="true"
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <p className="text-error text-sm mt-1">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
            Email <span className="text-error">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className={`
              w-full border rounded-lg px-3 py-2 bg-surface text-primary
              placeholder:text-muted
              ${errors.email ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-primary mb-1">
            Country of birth <span className="text-error">*</span>
          </label>
          <select
            id="country"
            value={data.countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={`
              w-full border rounded-lg px-3 py-2 bg-surface text-primary
              ${errors.countryCode ? 'border-error' : 'border-border'}
              focus:outline-none focus:ring-2 focus:ring-accent
            `}
            aria-required="true"
            aria-invalid={!!errors.countryCode}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.countryCode && <p className="text-error text-sm mt-1">{errors.countryCode}</p>}
        </div>

        {/* Phone number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-primary mb-1">
            Phone number <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={data.phoneCountryCode}
              onChange={(e) => onUpdate({ phoneCountryCode: e.target.value })}
              className="w-24 border border-border rounded-lg px-2 py-2 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.phoneCode}>
                  {country.phoneCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              id="phone"
              value={data.phoneNumber}
              onChange={(e) => onUpdate({ phoneNumber: e.target.value })}
              placeholder="123-456-7890"
              className={`
                flex-1 border rounded-lg px-3 py-2 bg-surface text-primary
                placeholder:text-muted
                ${errors.phoneNumber ? 'border-error' : 'border-border'}
                focus:outline-none focus:ring-2 focus:ring-accent
              `}
              aria-required="true"
              aria-invalid={!!errors.phoneNumber}
            />
          </div>
          {errors.phoneNumber && <p className="text-error text-sm mt-1">{errors.phoneNumber}</p>}
        </div>

        {/* Expertise */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Expertise / Topics you can help with <span className="text-error">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleExpertise(option.value)}
                className={`
                  px-3 py-1.5 rounded-full text-sm transition-colors
                  ${
                    selectedExpertise.includes(option.value)
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-border text-primary hover:bg-surface-hover'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
            {/* Other button */}
            <button
              type="button"
              onClick={() => setShowOtherInput(true)}
              className="px-3 py-1.5 rounded-full text-sm transition-colors bg-surface border border-dashed border-border text-muted hover:bg-surface-hover hover:text-primary"
            >
              + Other
            </button>
          </div>

          {/* Other input field */}
          {showOtherInput && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={otherInputValue}
                onChange={(e) => setOtherInputValue(e.target.value)}
                onKeyDown={handleOtherInputKeyDown}
                placeholder="Enter custom expertise"
                className="flex-1 border border-border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomExpertise}
                disabled={!otherInputValue.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtherInput(false);
                  setOtherInputValue('');
                }}
                className="p-2 text-muted hover:text-primary transition-colors"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Custom expertise chips */}
          {customExpertise.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {customExpertise.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-accent text-white"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() => removeCustomExpertise(value)}
                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                    aria-label={`Remove ${value}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errors.expertise && <p className="text-error text-sm mt-1">{errors.expertise}</p>}
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Languages you can conduct sessions in <span className="text-error">*</span>
          </label>

          <div className="space-y-3">
            {data.languages.map((lang) => (
              <div key={lang.id} className="flex items-center gap-2">
                <select
                  value={lang.languageCode}
                  onChange={(e) => updateLanguage(lang.id, 'languageCode', e.target.value)}
                  className="flex-1 border border-border rounded-lg px-3 py-2 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>

                <select
                  value={lang.proficiencyLevel}
                  onChange={(e) =>
                    updateLanguage(lang.id, 'proficiencyLevel', e.target.value as LanguageProficiency)
                  }
                  className="w-32 border border-border rounded-lg px-3 py-2 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {LANGUAGE_PROFICIENCY_OPTIONS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeLanguage(lang.id)}
                  className="p-2 text-muted hover:text-error transition-colors"
                  aria-label="Remove language"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addLanguage}
              className="flex items-center gap-2 text-accent hover:text-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add another language</span>
            </button>
          </div>
          {errors.languages && <p className="text-error text-sm mt-1">{errors.languages}</p>}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation onNext={onNext} canGoBack={false} canGoNext={canGoNext} />
    </div>
  );
};
