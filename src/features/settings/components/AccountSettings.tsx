"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useProfile } from "../hooks/useProfile";
import { useAvatarUpload } from "../hooks/useAvatarUpload";
import { AvatarCropModal } from "./AvatarCropModal";
import { COUNTRIES } from "@/features/shared/constants/options";
import { TIMEZONE_OPTIONS } from "@/features/shared/constants/options";

export function AccountSettings() {
  const { user, profile, loading, updateProfile, refetch } = useProfile();
  const { uploadAvatar, uploading } = useAvatarUpload();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+81");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [timezone, setTimezone] = useState("Asia/Tokyo");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  const avatarUrl = profile?.avatar_url
    ? `${profile.avatar_url}?v=${profile.avatar_updated_at ?? "0"}`
    : "/avatar-placeholder.png";

  useEffect(() => {
    setFirstName(profile?.first_name ?? "");
    setLastName(profile?.last_name ?? "");
    setPhoneCountryCode(profile?.phone_country_code ?? "+81");
    setPhoneNumber(profile?.phone_number ?? "");
    setTimezone(profile?.timezone ?? "Asia/Tokyo");
  }, [profile]);

  const canEdit = useMemo(() => !!user && !loading, [user, loading]);

  // ファイル選択したらモーダルを開くだけ
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2MB制限
    if (file.size > 2 * 1024 * 1024) {
      setMsg("File size must be <= 2MB");
      return;
    }

    setMsg(null);
    setPickedFile(file);
    setCropOpen(true);

    // 同じファイルを再選択できるように input をリセット
    e.currentTarget.value = "";
  };

  // モーダル Save → upload → 反映
  const onSaveAvatar = async (croppedFile: File) => {
    const res = await uploadAvatar(croppedFile);
    if (!res.ok) {
      setMsg("Upload failed");
      return;
    }

    await refetch();

    setCropOpen(false);
    setPickedFile(null);
    setMsg("Uploaded!");
  };

  const onSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    setMsg(null);

    const res = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone_country_code: phoneCountryCode,
      phone_number: phoneNumber,
      timezone: timezone,
    });

    setMsg(res.ok ? "Saved!" : "Save failed");
    setSaving(false);
  };

  return (
    <div className="flex-1">
      <AvatarCropModal
        open={cropOpen}
        file={pickedFile}
        onClose={() => {
          setCropOpen(false);
          setPickedFile(null);
        }}
        onSave={onSaveAvatar}
      />
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

      <div className="flex items-start gap-10">
        {/* 左：プロフィール画像 */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={avatarUrl}
              alt="profile"
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        </div>

        {/* 右：Upload + フォーム */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <label className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm font-semibold cursor-pointer">
              Upload photo
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onPickFile}
                disabled={!canEdit || uploading}
              />
            </label>

            <div className="text-xs text-gray-500">
              Maximum size – 2MB
              <br />
              JPG or PNG format
            </div>
          </div>

          {/* 名前 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First name • Required
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4"
            disabled={!canEdit}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4"
            disabled={!canEdit}
          />

          {/* 電話番号 */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number
          </label>

          <div className="flex gap-2 mb-4">
            <select
              value={phoneCountryCode}
              onChange={(e) => setPhoneCountryCode(e.target.value)}
              className="w-24 border border-gray-300 rounded-lg px-2 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              disabled={!canEdit}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.phoneCode}>
                  {country.phoneCode}
                </option>
              ))}
            </select>

            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="123-456-7890"
              className="flex-1 border rounded-lg px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              disabled={!canEdit}
            />
          </div>

          {/* タイムゾーン */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>

          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-6"
            disabled={!canEdit}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>

          {/* 保存 */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={!canEdit || saving}
              className="px-5 py-2 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {msg && <div className="text-sm text-gray-600">{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
