"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { validateAboutStep } from "@/features/mentor/utils/validation";
import type { MentorSettingsFormData } from "../types/mentorSettings";
import { initialMentorSettingsFormData } from "../types/mentorSettings";
import type { MentorSettingsSection } from "../types/mentorSettings";

const NO_ROWS_ERROR_CODE = "PGRST116";

type SaveResult = {
  ok: boolean;
  message: string;
};

export function useMentorSettings() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingSection, setSavingSection] =
    useState<MentorSettingsSection | null>(null);
  const [formData, setFormData] = useState<MentorSettingsFormData>(
    initialMentorSettingsFormData
  );

  const fetchMentorSettings = useCallback(async () => {
    if (!user) {
      setMentorId(null);
      setFetchError("User not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (mentorError && mentorError.code !== NO_ROWS_ERROR_CODE) {
      setFetchError("Failed to load mentor profile");
      setLoading(false);
      return;
    }

    if (!mentor) {
      setMentorId(null);
      setFetchError("Mentor profile not found");
      setLoading(false);
      return;
    }

    const [{ data: languages }, { data: expertise }, { data: availability }] =
      await Promise.all([
        supabase
          .from("mentor_languages")
          .select("id, language_code, language_name, proficiency_level")
          .eq("mentor_id", mentor.id),
        supabase
          .from("mentor_expertise")
          .select("id, expertise")
          .eq("mentor_id", mentor.id),
        supabase
          .from("mentor_availability")
          .select("id, day_of_week, start_time, end_time, is_enabled")
          .eq("mentor_id", mentor.id)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);

    setMentorId(mentor.id);
    setFormData({
      about: {
        firstName: mentor.first_name ?? "",
        lastName: mentor.last_name ?? "",
        email: mentor.email ?? "",
        countryCode: mentor.country_code ?? "",
        phoneCountryCode: mentor.phone_country_code ?? "",
        phoneNumber: mentor.phone_number ?? "",
        expertise: expertise?.map((item) => item.expertise) ?? [],
        languages:
          languages && languages.length > 0
            ? languages.map((item) => ({
                id: item.id,
                languageCode: item.language_code,
                languageName: item.language_name,
                proficiencyLevel: item.proficiency_level,
              }))
            : initialMentorSettingsFormData.about.languages,
      },
      photo: {
        avatarUrl: mentor.avatar_url ?? "",
      },
      education: {
        hasNoDegree: mentor.has_no_degree,
        university: mentor.university ?? "",
        degree: mentor.degree ?? "",
        degreeType: mentor.degree_type,
        specialization: mentor.specialization ?? "",
      },
      description: {
        introduction: mentor.introduction ?? "",
        workExperience: mentor.work_experience ?? "",
        motivation: mentor.motivation ?? "",
        headline: mentor.headline ?? "",
      },
      video: {
        videoUrl: mentor.video_url ?? "",
      },
      availability: {
        timezone: mentor.timezone ?? "",
        slots:
          availability?.map((slot) => ({
            id: slot.id,
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time,
            isEnabled: slot.is_enabled,
          })) ?? [],
      },
      pricing: {
        hourlyRate: mentor.hourly_rate ?? 0,
      },
    });

    setLoading(false);
  }, [supabase, user]);

  const saveAbout = useCallback(async (): Promise<SaveResult> => {
    if (!mentorId || !user) {
      return { ok: false, message: "Mentor profile not found" };
    }

    const errors = validateAboutStep({
      firstName: formData.about.firstName,
      lastName: formData.about.lastName,
      email: formData.about.email,
      countryCode: formData.about.countryCode,
      phoneCountryCode: formData.about.phoneCountryCode,
      phoneNumber: formData.about.phoneNumber,
      expertise: formData.about.expertise,
      languages: formData.about.languages,
    });

    if (Object.keys(errors).length > 0) {
      return {
        ok: false,
        message: Object.values(errors)[0] ?? "Validation failed",
      };
    }

    setSavingSection("about");
    try {
      const { error: mentorError } = await supabase
        .from("mentors")
        .update({
          first_name: formData.about.firstName,
          last_name: formData.about.lastName,
          email: formData.about.email,
          country_code: formData.about.countryCode,
          phone_country_code: formData.about.phoneCountryCode,
          phone_number: formData.about.phoneNumber,
        })
        .eq("id", mentorId);

      if (mentorError) {
        return { ok: false, message: "Failed to save profile" };
      }

      const { error: deleteLanguageError } = await supabase
        .from("mentor_languages")
        .delete()
        .eq("mentor_id", mentorId);

      if (deleteLanguageError) {
        return { ok: false, message: "Failed to replace languages" };
      }

      const languageRows = formData.about.languages
        .filter((item) => item.languageCode)
        .map((item) => ({
          mentor_id: mentorId,
          language_code: item.languageCode,
          language_name: item.languageName,
          proficiency_level: item.proficiencyLevel,
        }));

      if (languageRows.length > 0) {
        const { error: insertLanguageError } = await supabase
          .from("mentor_languages")
          .insert(languageRows);
        if (insertLanguageError) {
          return { ok: false, message: "Failed to replace languages" };
        }
      }

      const { error: deleteExpertiseError } = await supabase
        .from("mentor_expertise")
        .delete()
        .eq("mentor_id", mentorId);

      if (deleteExpertiseError) {
        return { ok: false, message: "Failed to replace expertise" };
      }

      const expertiseRows = formData.about.expertise.map((item) => ({
        mentor_id: mentorId,
        expertise: item,
      }));
      if (expertiseRows.length > 0) {
        const { error: insertExpertiseError } = await supabase
          .from("mentor_expertise")
          .insert(expertiseRows);
        if (insertExpertiseError) {
          return { ok: false, message: "Failed to replace expertise" };
        }
      }

      const { error: userError } = await supabase
        .from("users")
        .update({
          first_name: formData.about.firstName,
          last_name: formData.about.lastName,
          phone_country_code: formData.about.phoneCountryCode,
          phone_number: formData.about.phoneNumber,
        })
        .eq("id", user.id);

      if (userError) {
        return { ok: false, message: "Failed to sync user profile" };
      }

      return { ok: true, message: "Saved" };
    } catch {
      return { ok: false, message: "Unexpected error" };
    } finally {
      setSavingSection(null);
    }
  }, [formData.about, mentorId, supabase, user]);

  useEffect(() => {
    fetchMentorSettings();
  }, [fetchMentorSettings]);

  return {
    loading,
    mentorId,
    fetchError,
    savingSection,
    formData,
    setFormData,
    saveAbout,
    refetch: fetchMentorSettings,
  };
}
