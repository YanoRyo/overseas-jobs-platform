import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("policy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const LAST_UPDATED = "April 9, 2026";

const termsSections = [
  {
    id: "terms-overview",
    title: "1. About Bridgeee",
    paragraphs: [
      "Bridgeee is a platform that helps students discover mentors, exchange messages, request or book lessons, and complete payments for learning sessions.",
      "When you create an account, browse mentors, send messages, request bookings, schedule lessons, leave reviews, or receive payments as a mentor, you agree to these Terms of Service.",
    ],
  },
  {
    id: "terms-account",
    title: "2. Accounts and Eligibility",
    paragraphs: [
      "You are responsible for keeping your account information accurate, complete, and secure. Do not share your login credentials or impersonate another person.",
      "If you join as a mentor, you are responsible for the accuracy of your profile, availability, pricing, and any professional information you publish on Bridgeee.",
    ],
    bullets: [
      "Use your real identity and contact information.",
      "Choose the correct role when signing up or using mentor features.",
      "Do not create accounts for fraud, spam, harassment, or abuse.",
    ],
  },
  {
    id: "terms-bookings",
    title: "3. Lessons, Bookings, and Payments",
    paragraphs: [
      "Bridgeee allows students to request lessons, send preferred times, book available slots, and pay through supported payment providers.",
      "A lesson is not considered fully confirmed until the applicable booking and payment steps in the product are completed.",
      "Mentors are responsible for keeping their availability current. Students are responsible for confirming times, reviewing pricing, and completing payment when required.",
    ],
    bullets: [
      "Prices shown on the platform may change over time.",
      "Payment processing may be handled by third-party providers such as Stripe.",
      "Refunds, cancellations, rescheduling, and payout handling may depend on platform rules, mentor actions, and payment-provider requirements.",
    ],
  },
  {
    id: "terms-conduct",
    title: "4. Messages, Reviews, and Community Conduct",
    paragraphs: [
      "Bridgeee may provide messaging, reviews, favorites, booking requests, and other communication features to help mentors and students coordinate.",
      "You are responsible for the content you send or publish. Do not post illegal, misleading, abusive, defamatory, infringing, or spam content.",
    ],
    bullets: [
      "Do not use the service to harass, threaten, or exploit others.",
      "Do not submit fake reviews or misleading profile claims.",
      "Do not attempt to bypass platform safeguards, payment flows, or abuse-detection systems.",
    ],
  },
  {
    id: "terms-platform-role",
    title: "5. Platform Role and No Guarantee",
    paragraphs: [
      "Bridgeee provides software and coordination tools, but does not guarantee lesson quality, mentoring outcomes, job placement, interview success, visa results, or any specific personal or business result.",
      "We may moderate content, suspend features, or remove accounts when needed to protect users, comply with law, or preserve the safety of the platform.",
    ],
  },
  {
    id: "terms-termination",
    title: "6. Suspension, Termination, and Updates",
    paragraphs: [
      "We may suspend or terminate access if we believe you violated these terms, created legal or safety risk, or used the platform in a dishonest or harmful way.",
      "We may update these terms from time to time. Continued use of Bridgeee after an update means you accept the revised terms.",
    ],
  },
] as const;

const privacySections = [
  {
    id: "privacy-collect",
    title: "1. Information We Collect",
    paragraphs: [
      "We collect information you provide directly, information created through your use of the service, and technical information needed to operate the platform.",
    ],
    bullets: [
      "Account details such as email address, name, role, avatar, and login-related information.",
      "Mentor profile data such as country, timezone, rates, availability, introduction, education, languages, and specialties.",
      "Student and mentor activity such as favorites, messages, booking requests, bookings, reviews, and lesson history.",
      "Payment-related records such as booking amounts, payout status, and payment provider identifiers. Card details are generally processed by the payment provider rather than stored directly by Bridgeee.",
      "Technical data such as session information, device or browser context, and service logs used for security and reliability.",
    ],
  },
  {
    id: "privacy-use",
    title: "2. How We Use Information",
    paragraphs: [
      "We use personal information to operate, improve, secure, and support Bridgeee.",
    ],
    bullets: [
      "Create and maintain accounts.",
      "Show mentor listings and public profile information.",
      "Enable messaging, booking requests, scheduling, payments, reviews, favorites, and meeting links.",
      "Send transactional emails, booking notices, verification emails, and support communications.",
      "Detect fraud, abuse, payment risk, security incidents, and policy violations.",
      "Comply with legal, tax, accounting, and regulatory obligations.",
    ],
  },
  {
    id: "privacy-share",
    title: "3. How We Share Information",
    paragraphs: [
      "We share information only when needed to run the platform, complete transactions, comply with law, or protect users and the service.",
    ],
    bullets: [
      "With other users where needed for the service experience, such as mentor profiles, booking details, review content, and messages.",
      "With service providers such as Supabase for backend services, Stripe for payments, email providers for transactional emails, and meeting-link providers when lessons require meeting URLs.",
      "With regulators, law enforcement, courts, or advisors when required by law or necessary to protect rights, safety, or the integrity of the platform.",
    ],
  },
  {
    id: "privacy-retention",
    title: "4. Data Retention",
    paragraphs: [
      "We keep information for as long as needed to operate the service, resolve disputes, prevent abuse, enforce our agreements, and meet legal or accounting obligations.",
      "Different categories of data may be retained for different periods depending on their purpose and the legal requirements that apply.",
    ],
  },
  {
    id: "privacy-choices",
    title: "5. Your Choices and Rights",
    paragraphs: [
      "You may be able to update profile information from your account settings and request help if you need corrections or account support.",
      "Depending on where you live, you may have legal rights to access, correct, delete, or limit certain uses of your personal information.",
    ],
  },
  {
    id: "privacy-security",
    title: "6. Security and Policy Updates",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational measures to protect information, but no online system can be guaranteed to be perfectly secure.",
      "We may update this Privacy Policy over time. When we do, we will post the revised version on this page with a new effective date.",
    ],
  },
] as const;

function PolicySection({
  id,
  title,
  paragraphs,
  bullets,
}: {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <div className="mt-4 space-y-4 text-sm leading-7 text-secondary">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {bullets && bullets.length > 0 ? (
        <ul className="mt-4 space-y-3 pl-5 text-sm leading-7 text-secondary">
          {bullets.map((bullet) => (
            <li key={bullet} className="list-disc">
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default async function PolicyPage() {
  const t = await getTranslations("policy");
  return (
    <div className="min-h-screen bg-[#fafafb]">
      <main className="mx-auto max-w-[960px] px-6 py-12">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {t("legalLabel")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-primary">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary">
            {t("pageDescription")}
          </p>
          <p className="mt-3 text-sm text-muted">
            {t("lastUpdated", { date: LAST_UPDATED })}
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {t("draftNotice")}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-[#fafafb] p-5">
              <h2 className="text-lg font-semibold text-primary">
                {t("termsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {t("termsDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-[#fafafb] p-5">
              <h2 className="text-lg font-semibold text-primary">
                {t("privacyTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                {t("privacyDescription")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href="#terms"
              className="rounded-full border border-border px-4 py-2 font-medium text-primary transition hover:bg-surface-hover"
            >
              {t("jumpToTerms")}
            </Link>
            <Link
              href="#privacy"
              className="rounded-full border border-border px-4 py-2 font-medium text-primary transition hover:bg-surface-hover"
            >
              {t("jumpToPrivacy")}
            </Link>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <section id="terms" className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-3xl font-semibold text-primary">
                {t("termsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary">
                {t("termsSubDescription")}
              </p>
            </div>

            <div className="space-y-5">
              {termsSections.map((section) => (
                <PolicySection key={section.id} {...section} />
              ))}
            </div>
          </section>

          <section id="privacy" className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-3xl font-semibold text-primary">
                {t("privacyTitle")}
              </h2>
              <p className="mt-2 text-sm leading-7 text-secondary">
                {t("privacySubDescription")}
              </p>
            </div>

            <div className="space-y-5">
              {privacySections.map((section) => (
                <PolicySection key={section.id} {...section} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
