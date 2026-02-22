"use client";

import { useState } from "react";
import { MentorTopTabs } from "./MentorTopTabs";
import { MentorSettingsNav } from "./MentorSettingsNav";
import type { MentorSettingsSection } from "../types/mentorSettings";
import { useMentorSettings } from "../hooks/useMentorSettings";
import { AboutSection } from "./mentor-sections/AboutSection";
import { PhotoSection } from "./mentor-sections/PhotoSection";
import { EducationSection } from "./mentor-sections/EducationSection";
import { DescriptionSection } from "./mentor-sections/DescriptionSection";
import { VideoSection } from "./mentor-sections/VideoSection";
import { AvailabilitySection } from "./mentor-sections/AvailabilitySection";
import { PricingSection } from "./mentor-sections/PricingSection";

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
    saveEducation,
    saveDescription,
    saveVideo,
    saveAvailability,
    savePricing,
  } = useMentorSettings();
  const [activeSection, setActiveSection] =
    useState<MentorSettingsSection>("about");
  const [sectionMessage, setSectionMessage] = useState<
    Partial<Record<MentorSettingsSection, string>>
  >({});

  const title = SECTION_TITLES[activeSection];

  const saveAboutSection = async () => {
    const result = await saveAbout();
    setSectionMessage((prev) => ({ ...prev, about: result.message }));
  };

  const saveEducationSection = async () => {
    const result = await saveEducation();
    setSectionMessage((prev) => ({ ...prev, education: result.message }));
  };

  const saveDescriptionSection = async () => {
    const result = await saveDescription();
    setSectionMessage((prev) => ({ ...prev, description: result.message }));
  };

  const saveVideoSection = async () => {
    const result = await saveVideo();
    setSectionMessage((prev) => ({ ...prev, video: result.message }));
  };

  const saveAvailabilitySection = async () => {
    const result = await saveAvailability();
    setSectionMessage((prev) => ({ ...prev, availability: result.message }));
  };

  const savePricingSection = async () => {
    const result = await savePricing();
    setSectionMessage((prev) => ({ ...prev, pricing: result.message }));
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
                message={sectionMessage.about ?? null}
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
            ) : activeSection === "education" ? (
              <EducationSection
                data={formData.education}
                saving={savingSection === "education"}
                message={sectionMessage.education ?? null}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    education: { ...prev.education, ...patch },
                  }));
                }}
                onSave={saveEducationSection}
              />
            ) : activeSection === "description" ? (
              <DescriptionSection
                data={formData.description}
                saving={savingSection === "description"}
                message={sectionMessage.description ?? null}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: { ...prev.description, ...patch },
                  }));
                }}
                onSave={saveDescriptionSection}
              />
            ) : activeSection === "video" ? (
              <VideoSection
                data={formData.video}
                saving={savingSection === "video"}
                message={sectionMessage.video ?? null}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    video: { ...prev.video, ...patch },
                  }));
                }}
                onSave={saveVideoSection}
              />
            ) : activeSection === "availability" ? (
              <AvailabilitySection
                data={formData.availability}
                saving={savingSection === "availability"}
                message={sectionMessage.availability ?? null}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    availability: { ...prev.availability, ...patch },
                  }));
                }}
                onSave={saveAvailabilitySection}
              />
            ) : activeSection === "pricing" ? (
              <PricingSection
                data={formData.pricing}
                saving={savingSection === "pricing"}
                message={sectionMessage.pricing ?? null}
                onChange={(patch) => {
                  setFormData((prev) => ({
                    ...prev,
                    pricing: { ...prev.pricing, ...patch },
                  }));
                }}
                onSave={savePricingSection}
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
