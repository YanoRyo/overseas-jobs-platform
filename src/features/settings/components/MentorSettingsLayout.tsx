"use client";

import { useState } from "react";
import { MentorTopTabs } from "./MentorTopTabs";
import { MentorSettingsNav } from "./MentorSettingsNav";
import type { MentorSettingsSection } from "../types/mentorSettings";
import { useMentorSettings } from "../hooks/useMentorSettings";
import { AboutSection } from "./mentor-sections/AboutSection";
import { PhotoSection } from "./mentor-sections/PhotoSection";

const SECTION_TITLES: Record<MentorSettingsSection, string> = {
  about: "About",
  photo: "Photo",
  education: "Education",
  description: "Profile description",
  video: "Video introduction",
  availability: "Availability",
  pricing: "Pricing",
};

export function MentorSettingsLayout() {
  const {
    loading,
    fetchError,
    mentorId,
    formData,
    savingSection,
    setFormData,
    saveAbout,
  } = useMentorSettings();
  const [activeSection, setActiveSection] =
    useState<MentorSettingsSection>("about");
  const [aboutMessage, setAboutMessage] = useState<string | null>(null);

  const title = SECTION_TITLES[activeSection];

  const saveAboutSection = async () => {
    const result = await saveAbout();
    setAboutMessage(result.message);
  };

  return (
    <div className="min-h-screen bg-[#fafafb]">
      <MentorTopTabs />

      <main className="mx-auto flex max-w-[1200px] gap-16 px-6 py-12">
        <MentorSettingsNav active={activeSection} onChange={setActiveSection} />

        <section className="min-h-[520px] w-full max-w-[680px]">
          <h1 className="mb-6 text-[48px] text-5xl font-bold tracking-[-0.02em] text-[#1f1f2d]">
            {title}
          </h1>

          <div className="rounded-xl border border-[#e3e4ea] bg-white p-6">
            {loading ? (
              <p className="text-sm text-[#606579]">Loading profile...</p>
            ) : fetchError ? (
              <p className="text-sm text-[#c32a68]">{fetchError}</p>
            ) : activeSection === "about" ? (
              <AboutSection
                data={formData.about}
                saving={savingSection === "about"}
                message={aboutMessage}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    about: { ...prev.about, ...patch },
                  }));
                }}
                onSave={saveAboutSection}
              />
            ) : activeSection === "photo" ? (
              <PhotoSection
                mentorId={mentorId}
                avatarUrl={formData.photo.avatarUrl}
                onSaved={(url) => {
                  setFormData((prev) => ({
                    ...prev,
                    photo: { avatarUrl: url },
                  }));
                }}
              />
            ) : (
              <p className="text-sm text-[#606579]">
                このセクションの編集フォームは次のコミットで実装します。
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
