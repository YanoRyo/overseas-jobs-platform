"use client";

import Image from "next/image";
import { useCallback, useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, Check, User } from "lucide-react";
import type { PhotoFormData } from "../../types/registration";
import { StepNavigation } from "../shared/StepNavigation";
import { validateImageFile } from "@/lib/validation/fileUpload";

type PhotoStepProps = {
  data: PhotoFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<PhotoFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
};

export const PhotoStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  canGoNext,
}: PhotoStepProps) => {
  const t = useTranslations("mentorRegistration.photo");
  const tOptions = useTranslations("options");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileError(null);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setFileError(
          validation.code === "too_large" ? t("fileSizeLimit") : t("selectImage")
        );
        event.currentTarget.value = "";
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      onUpdate({
        avatarFile: file,
        avatarUrl: previewUrl,
      });
    },
    [onUpdate, t]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const previewUrl = data.avatarUrl;

  // メモリリーク防止: URL.createObjectURLで作成したURLを解放
  useEffect(() => {
    return () => {
      if (previewUrl && data.avatarFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, data.avatarFile]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="text-secondary mt-2">
          {t("description")}
        </p>
      </div>

      {/* Photo preview and upload */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Preview area */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
            relative w-48 h-48 rounded-xl overflow-hidden bg-surface border-2
            ${errors.avatar ? "border-error" : "border-border"}
            flex items-center justify-center
          `}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile preview"
                fill
                className="object-cover"
                sizes="192px"
                unoptimized
              />
            ) : (
              <User className="w-24 h-24 text-muted" />
            )}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="
              flex items-center gap-2 px-4 py-2
              border border-border rounded-lg
              text-primary hover:bg-surface-hover
              transition-colors
            "
          >
            <Upload className="w-4 h-4" />
            <span>{previewUrl ? t("uploadNewPhoto") : t("uploadPhoto")}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload profile photo"
          />

          {(errors.avatar || fileError) && (
            <p className="text-error text-sm">{fileError || errors.avatar}</p>
          )}
        </div>

        {/* Requirements checklist */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-primary mb-4">
            {t("requirements")}
          </h2>
          <ul className="space-y-3">
            {(['facingForward', 'headAndShoulders', 'centered', 'faceVisible', 'onlyPerson', 'colorPhoto', 'noLogos'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-secondary">{tOptions(`photoRequirements.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation onBack={onBack} onNext={onNext} canGoNext={canGoNext} />
    </div>
  );
};
