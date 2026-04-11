"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Info, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import type { VideoFormData } from "../../types/registration";
import { StepNavigation } from "../shared/StepNavigation";

type VideoStepProps = {
  data: VideoFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<VideoFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoNext: boolean;
};

// YouTubeのビデオIDを抽出（URL objectを使用した堅牢なパーシング）
const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    if (hostname === "youtube.com") {
      // /watch?v=VIDEO_ID
      const vParam = urlObj.searchParams.get("v");
      if (vParam) return vParam;

      // /embed/VIDEO_ID, /shorts/VIDEO_ID, /live/VIDEO_ID
      const pathMatch = urlObj.pathname.match(
        /^\/(embed|shorts|live)\/([a-zA-Z0-9_-]+)/
      );
      if (pathMatch) return pathMatch[2];
    }

    if (hostname === "youtu.be") {
      // youtu.be/VIDEO_ID
      const pathMatch = urlObj.pathname.match(/^\/([a-zA-Z0-9_-]+)/);
      if (pathMatch) return pathMatch[1];
    }

    return null;
  } catch {
    return null;
  }
};

// YouTube/Vimeo URLからembed URLを生成
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // YouTube
  const youtubeVideoId = extractYouTubeVideoId(url);
  if (youtubeVideoId) {
    return `https://www.youtube.com/embed/${youtubeVideoId}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};

export const VideoStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  onSkip,
  canGoNext,
}: VideoStepProps) => {
  const t = useTranslations("mentorRegistration.video");
  const tOptions = useTranslations("options");
  const tCommon = useTranslations("common");
  const [showRequirements, setShowRequirements] = useState(true);

  const embedUrl = useMemo(() => getEmbedUrl(data.videoUrl), [data.videoUrl]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="text-secondary mt-2">
          {t("description")}
        </p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          {t("optional")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - URL input and preview */}
        <div className="space-y-6">
          <p className="text-secondary">
            {t("instruction")}
          </p>

          {/* Video preview */}
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-border">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Video preview"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <p className="text-sm">{t("previewPlaceholder")}</p>
              </div>
            )}
          </div>

          {/* URL input */}
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-primary mb-2"
            >
              {t("pasteLink")}
            </label>
            <p className="text-sm text-muted mb-2">
              {t("learnHow")}{" "}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {t("youtube")}
              </a>{" "}
              {tCommon("or")}{" "}
              <a
                href="https://vimeo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {t("vimeo")}
              </a>
            </p>
            <input
              type="url"
              id="videoUrl"
              value={data.videoUrl}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder={t("urlPlaceholder")}
              className={`
                w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                ${errors.videoUrl ? "border-error" : "border-border"}
                focus:outline-none focus:ring-2 focus:ring-accent
              `}
            />
            {errors.videoUrl && (
              <p className="text-error text-sm mt-1">{errors.videoUrl}</p>
            )}
          </div>
        </div>

        {/* Right column - Requirements */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <button
            type="button"
            onClick={() => setShowRequirements(!showRequirements)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-semibold text-primary">
              {t("requirements")}
            </h2>
            {showRequirements ? (
              <ChevronUp className="w-5 h-5 text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted" />
            )}
          </button>

          <p className="text-sm text-muted mt-1">
            {t("requirementsDescription")}
          </p>

          {showRequirements && (
            <div className="mt-6 space-y-6">
              {/* Do list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">{t("do")}</span>
                </div>
                <ul className="space-y-2">
                  {(['duration', 'horizontal', 'lighting', 'stable', 'faceVisible', 'experience', 'greet'] as const).map((key) => (
                    <li
                      key={key}
                      className="flex items-start gap-2 text-sm text-secondary"
                    >
                      <span className="text-muted">•</span>
                      <span>{tOptions(`videoRequirementsDo.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don't list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-5 h-5 text-error" />
                  <span className="font-medium text-error">{t("dont")}</span>
                </div>
                <ul className="space-y-2">
                  {(['surname', 'logos', 'slideshows', 'otherPeople'] as const).map((key) => (
                    <li
                      key={key}
                      className="flex items-start gap-2 text-sm text-secondary"
                    >
                      <span className="text-muted">•</span>
                      <span>{tOptions(`videoRequirementsDont.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        canGoNext={canGoNext}
        isOptionalStep={true}
      />
    </div>
  );
};
