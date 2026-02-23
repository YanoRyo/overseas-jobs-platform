"use client";

import { useState } from "react";
import Image from "next/image";
import { AvatarCropModal } from "../AvatarCropModal";
import { useMentorAvatarUpload } from "../../hooks/useMentorAvatarUpload";

type Props = {
  mentorId: string | null;
  avatarUrl: string;
  onSaved: (url: string) => void;
};

export function PhotoSection({ mentorId, avatarUrl, onSaved }: Props) {
  const { uploading, uploadAvatar } = useMentorAvatarUpload(mentorId);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onPickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("File size must be <= 2MB");
      return;
    }

    setMessage(null);
    setPickedFile(file);
    setCropOpen(true);
    event.currentTarget.value = "";
  };

  const onSaveAvatar = async (croppedFile: File) => {
    const result = await uploadAvatar(croppedFile);

    if (!result.ok || !result.url) {
      setMessage(result.error ?? "Upload failed");
      return;
    }

    onSaved(result.url);
    setCropOpen(false);
    setPickedFile(null);
    setMessage("Saved");
  };

  return (
    <div className="space-y-4">
      <AvatarCropModal
        open={cropOpen}
        file={pickedFile}
        onClose={() => {
          setCropOpen(false);
          setPickedFile(null);
        }}
        onSave={onSaveAvatar}
      />

      <p className="text-sm text-[#606579]">Profile image</p>

      <div className="flex items-start gap-8">
        <div className="relative h-40 w-40 overflow-hidden rounded-[12px] bg-[#eceef5]">
          <Image
            src={avatarUrl || "/avatar-placeholder.png"}
            alt="profile"
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>

        <div>
          <label className="inline-flex h-[44px] cursor-pointer items-center rounded-[10px] border-2 border-[#1f1f2d] bg-white px-5 text-sm font-semibold text-[#171923]">
            Upload photo
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onPickFile}
              disabled={uploading}
            />
          </label>

          <p className="mt-3 text-xs text-[#6f7486]">
            Maximum size – 2MB
            <br />
            JPG or PNG format
          </p>
        </div>
      </div>

      {message && <p className="text-sm text-[#5e6478]">{message}</p>}
    </div>
  );
}
