"use client";

import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { MentorPreviewSection } from "./MentorPreviewSection";

export function OnboardingLandingPage() {
  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#ecf7ff_0%,#f6fbff_36%,#ffffff_100%)]">
      <div
        aria-hidden="true"
        className="absolute left-[-8rem] top-14 h-64 w-64 rounded-full bg-white/90 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/3 top-[34rem] h-44 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-16 right-16 h-60 w-60 rounded-full bg-cyan-50 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:gap-24 lg:pb-28 lg:pt-12">
        <HeroSection />
        <ProblemSection />
        <MentorPreviewSection />
      </div>
    </main>
  );
}
