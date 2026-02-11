"use client";

import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import Image from "next/image";

type Area = { x: number; y: number; width: number; height: number };

type Props = {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onSave: (croppedFile: File) => Promise<void>;
};

export function AvatarCropModal({ open, file, onClose, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const objectUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    // 開くたび初期化
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setSaving(false);
    }
  }, [open]);

  if (!open || !file || !objectUrl) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);

    // ここでは「切り抜き後のFile」を作るだけ
    // 実際の切り抜きは親側（AccountSettings）でやってもいいけど、
    // modal内で完結した方が見通しが良いのでここで作るのが楽。
    const { getCroppedBlob } = await import("../utils/cropImage");

    const outType: "image/jpeg" | "image/png" =
      file.type === "image/png" ? "image/png" : "image/jpeg";

    const blob = await getCroppedBlob(objectUrl, croppedAreaPixels, outType);

    const ext = outType === "image/png" ? "png" : "jpg";
    const croppedFile = new File([blob], `avatar.${ext}`, { type: outType });

    await onSave(croppedFile);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-lg font-semibold">Edit thumbnail</div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex gap-6 p-6">
          {/* left crop area */}
          <div className="relative flex-1 min-h-[320px] bg-gray-100 rounded-xl overflow-hidden">
            <Cropper
              image={objectUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) =>
                setCroppedAreaPixels(areaPixels as Area)
              }
            />
          </div>

          {/* right preview */}
          <div className="w-56">
            <div className="text-sm text-gray-700 font-medium mb-2">
              Drag the box to adjust the preview image. This version of profile
              image will appear on the site.
            </div>

            <div className="rounded-xl border bg-white p-3">
              {/* 簡易プレビュー：元画像のサムネ（厳密な切り抜きプレビューは後でも追加可能） */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={objectUrl}
                  alt="preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-center gap-4 px-6 py-5 border-t">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-40 h-11 rounded-xl bg-accent text-white font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-40 h-11 rounded-xl border font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
