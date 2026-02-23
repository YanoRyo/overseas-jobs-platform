"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

type UseMentorAvatarUploadResult = {
  ok: boolean;
  url?: string;
  error?: string;
};

export function useMentorAvatarUpload(mentorId: string | null) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<UseMentorAvatarUploadResult> => {
    if (!mentorId || !user) {
      return { ok: false, error: "Mentor profile is missing" };
    }

    setUploading(true);

    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        return { ok: false, error: "Upload failed" };
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const [{ error: mentorError }, { error: userError }] = await Promise.all([
        supabase.from("mentors").update({ avatar_url: publicUrl }).eq("id", mentorId),
        supabase
          .from("users")
          .update({
            avatar_url: publicUrl,
            avatar_updated_at: new Date().toISOString(),
          })
          .eq("id", user.id),
      ]);

      if (mentorError || userError) {
        return { ok: false, error: "Failed to save avatar" };
      }

      return { ok: true, url: publicUrl };
    } catch {
      return { ok: false, error: "Unexpected error" };
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadAvatar };
}
