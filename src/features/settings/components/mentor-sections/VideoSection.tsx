"use client";

import { useMemo } from "react";
import type { MentorSettingsVideoForm } from "../../types/mentorSettings";

type Props = {
  data: MentorSettingsVideoForm;
  saving: boolean;
  message: string | null;
  onChange: (patch: Partial<MentorSettingsVideoForm>) => void;
  onSave: () => Promise<void>;
};

const extractYouTubeVideoId = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace("www.", "");

    if (hostname === "youtube.com") {
      const vParam = parsedUrl.searchParams.get("v");
      if (vParam) return vParam;

      const match = parsedUrl.pathname.match(
        /^\/(embed|shorts|live)\/([a-zA-Z0-9_-]+)/
      );
      if (match) return match[2];
    }

    if (hostname === "youtu.be") {
      const match = parsedUrl.pathname.match(/^\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
};

const getEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  const youtubeVideoId = extractYouTubeVideoId(url);
  if (youtubeVideoId) {
    return `https://www.youtube.com/embed/${youtubeVideoId}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};

export function VideoSection({ data, saving, message, onChange, onSave }: Props) {
  const embedUrl = useMemo(() => getEmbedUrl(data.videoUrl), [data.videoUrl]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">
          Video preview
        </label>
        <div className="aspect-video overflow-hidden rounded-[10px] border border-[#cfd3e1] bg-[#f6f7fb]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Video preview"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#6a7084]">
              Video preview will appear here
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#2d3348]">
          Video URL (YouTube / Vimeo)
        </label>
        <input
          type="url"
          value={data.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          className="w-full rounded-[10px] border border-[#cfd3e1] px-3 py-2.5 text-sm"
        />
      </div>

      <div className="pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-11 w-full rounded-[10px] border-2 border-[#1d4ed8] bg-[#2563eb] text-lg font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && <p className="mt-2 text-sm text-[#5e6478]">{message}</p>}
      </div>
    </div>
  );
}
