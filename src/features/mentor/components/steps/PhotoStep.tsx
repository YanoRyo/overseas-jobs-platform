"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { Upload, Check, User } from "lucide-react";
import type { PhotoFormData } from "../../types/registration";
import { PHOTO_REQUIREMENTS } from "../../../shared/constants/options";
import { StepNavigation } from "../shared/StepNavigation";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // エラーをクリア
      setFileError(null);

      // ファイル形式チェック
      if (!file.type.startsWith("image/")) {
        setFileError("Please select an image file");
        return;
      }

      // ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError("File size must be less than 5MB");
        return;
      }

      // プレビュー用のURLを作成
      const previewUrl = URL.createObjectURL(file);
      onUpdate({
        avatarFile: file,
        avatarUrl: previewUrl,
      });
    },
    [onUpdate]
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
        <h1 className="text-2xl font-bold text-primary">Profile photo</h1>
        <p className="text-secondary mt-2">
          Choose a photo that will help learners get to know you.
        </p>
      </div>

      {/* Photo preview and upload */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Preview area */}
        <div className="flex flex-col items-center gap-4">
          <div
            className={`
            w-48 h-48 rounded-xl overflow-hidden bg-surface border-2
            ${errors.avatar ? "border-error" : "border-border"}
            flex items-center justify-center
          `}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-full h-full object-cover"
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
            <span>{previewUrl ? "Upload new photo" : "Upload photo"}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
            What your photo needs
          </h2>
          <ul className="space-y-3">
            {PHOTO_REQUIREMENTS.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-secondary">{requirement}</span>
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
