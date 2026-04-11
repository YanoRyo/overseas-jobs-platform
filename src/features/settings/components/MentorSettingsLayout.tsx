"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useUser } from "@supabase/auth-helpers-react";
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
import { PayoutSection } from "./mentor-sections/PayoutSection";
import { PasswordChangeSection } from "./PasswordChangeSection";
import { MentorRegistrationCallout } from "./MentorRegistrationCallout";
import { SettingsTopTabs } from "./SettingsTopTabs";
import { isEmailProvider } from "@/features/auth/utils/authProvider";

const SECTION_TITLE_KEYS: Record<MentorSettingsSection, string> = {
  about: "about",
  photo: "photo",
  education: "education",
  description: "description",
  video: "video",
  availability: "availability",
  pricing: "pricing",
  payout: "payout",
  password: "password",
};

const VALID_SECTIONS = new Set<MentorSettingsSection>([
  "about", "photo", "education", "description",
  "video", "availability", "pricing", "payout", "password",
]);

type Props = {
  showMentorRegistrationCallout?: boolean;
};

export function MentorSettingsLayout({
  showMentorRegistrationCallout = false,
}: Props) {
  if (showMentorRegistrationCallout) {
    return (
      <div className="min-h-screen bg-[#fafafb]">
        <SettingsTopTabs role="mentor" activeTabId="settings" />

        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-10">
          <MentorRegistrationCallout />
        </main>
      </div>
    );
  }

  return <MentorSettingsContent />;
}

function MentorSettingsContent() {
  const user = useUser();
  const t = useTranslations("settings.mentorNav");
  const showPassword = isEmailProvider(user);
  const searchParams = useSearchParams();
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

  const sectionParam = searchParams.get("section");
  const initialSection: MentorSettingsSection =
    sectionParam && VALID_SECTIONS.has(sectionParam as MentorSettingsSection)
      ? (sectionParam as MentorSettingsSection)
      : "about";
  const [activeSection, setActiveSection] =
    useState<MentorSettingsSection>(initialSection);
  const [sectionMessage, setSectionMessage] = useState<
    Partial<Record<MentorSettingsSection, string>>
  >({});

  const title = t(SECTION_TITLE_KEYS[activeSection]);

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
      <SettingsTopTabs role="mentor" activeTabId="settings" />

      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-16 lg:py-10">
        <MentorSettingsNav active={activeSection} onChange={setActiveSection} showPassword={showPassword} />

        <section className="min-h-[520px] w-full min-w-0 max-w-[680px]">
          <h1 className="mb-6 text-3xl font-bold tracking-[-0.02em] text-[#1f1f2d] sm:text-4xl lg:text-[48px]">
            {title}
          </h1>

          <div className="rounded-xl border border-[#e3e4ea] bg-white p-4 sm:p-6">
            {loading ? (
              <p className="text-sm text-[#606579]">{t("loadingProfile")}</p>
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
            ) : activeSection === "payout" ? (
              <PayoutSection />
            ) : activeSection === "password" ? (
              <PasswordChangeSection />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
