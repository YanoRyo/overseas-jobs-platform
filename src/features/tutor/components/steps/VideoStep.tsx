'use client';

import { useState, useMemo } from 'react';
import { Info, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { VideoFormData } from '../../types/registration';
import { VIDEO_REQUIREMENTS } from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

type VideoStepProps = {
  data: VideoFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<VideoFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoNext: boolean;
};

// YouTube/Vimeo URLからembed URLを生成
const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
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
  const [showRequirements, setShowRequirements] = useState(true);

  const embedUrl = useMemo(() => getEmbedUrl(data.videoUrl), [data.videoUrl]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Video introduction</h1>
        <p className="text-secondary mt-2">Add a horizontal video of up to 2 minutes</p>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Adding a video is optional but highly recommended to increase your booking rate. You can
          add it later from your profile settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - URL input and preview */}
        <div className="space-y-6">
          <p className="text-secondary">
            Introduce yourself to students in the same language as your written description. If you
            teach a different language, include a short sample.
          </p>

          {/* URL input */}
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-primary mb-2">
              Or paste a link to your video
            </label>
            <p className="text-sm text-muted mb-2">
              Learn how to upload videos to{' '}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                YouTube
              </a>{' '}
              or{' '}
              <a
                href="https://vimeo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Vimeo
              </a>
            </p>
            <input
              type="url"
              id="videoUrl"
              value={data.videoUrl}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`
                w-full border rounded-lg px-3 py-2 bg-surface text-primary placeholder:text-muted
                ${errors.videoUrl ? 'border-error' : 'border-border'}
                focus:outline-none focus:ring-2 focus:ring-accent
              `}
            />
            {errors.videoUrl && <p className="text-error text-sm mt-1">{errors.videoUrl}</p>}
          </div>

          {/* Video preview */}
          {embedUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title="Video preview"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Right column - Requirements */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <button
            type="button"
            onClick={() => setShowRequirements(!showRequirements)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-semibold text-primary">Video requirements</h2>
            {showRequirements ? (
              <ChevronUp className="w-5 h-5 text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted" />
            )}
          </button>

          <p className="text-sm text-muted mt-1">
            Make sure your video meets the requirements to get approved
          </p>

          {showRequirements && (
            <div className="mt-6 space-y-6">
              {/* Do list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Check className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">Do</span>
                </div>
                <ul className="space-y-2">
                  {VIDEO_REQUIREMENTS.do.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                      <span className="text-muted">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Don't list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-5 h-5 text-error" />
                  <span className="font-medium text-error">Don&apos;t</span>
                </div>
                <ul className="space-y-2">
                  {VIDEO_REQUIREMENTS.dont.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                      <span className="text-muted">•</span>
                      <span>{item}</span>
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
