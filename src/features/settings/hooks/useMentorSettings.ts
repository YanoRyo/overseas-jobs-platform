"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { MentorSettingsFormData } from "../types/mentorSettings";
import { initialMentorSettingsFormData } from "../types/mentorSettings";

const NO_ROWS_ERROR_CODE = "PGRST116";

export function useMentorSettings() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchMentorSettings();
  }, [fetchMentorSettings]);

  return {
    loading,
    mentorId,
    fetchError,
    formData,
    setFormData,
    refetch: fetchMentorSettings,
  };
}
