"use client";

import { useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export function useAvatarUpload() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user) return { ok: false };

    try {
      setUploading(true);

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          avatar_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return { ok: true, url: publicUrl };
    } catch (e) {
      console.error("uploadAvatar error", e);
      return { ok: false };
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
}
