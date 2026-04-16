export type LegalSectionConfig = {
  id: string;
  paragraphCount: number;
  bulletCount?: number;
};

export const POLICY_CARD_CONFIG = [
  { id: "terms", href: "/terms" },
  { id: "privacy", href: "/privacy" },
  { id: "legal", href: "/legal" },
  { id: "cancellation", href: "/cancellation-policy" },
] as const;

export const TERMS_SECTION_CONFIG: readonly LegalSectionConfig[] = [
  { id: "overview", paragraphCount: 2 },
  { id: "accounts", paragraphCount: 2, bulletCount: 3 },
  { id: "bookings", paragraphCount: 2, bulletCount: 3 },
  { id: "conduct", paragraphCount: 2, bulletCount: 3 },
  { id: "platform", paragraphCount: 2 },
  { id: "updates", paragraphCount: 2 },
  { id: "liability", paragraphCount: 2 },
  { id: "governingLaw", paragraphCount: 2 },
] as const;

export const PRIVACY_SECTION_CONFIG: readonly LegalSectionConfig[] = [
  { id: "collection", paragraphCount: 1, bulletCount: 5 },
  { id: "use", paragraphCount: 1, bulletCount: 6 },
  { id: "sharing", paragraphCount: 1, bulletCount: 3 },
  { id: "retention", paragraphCount: 2 },
  { id: "rights", paragraphCount: 2 },
  { id: "security", paragraphCount: 2 },
] as const;

export const LEGAL_NOTICE_SECTION_CONFIG: readonly LegalSectionConfig[] = [
  { id: "seller", paragraphCount: 5 },
  { id: "pricing", paragraphCount: 2 },
  { id: "fees", paragraphCount: 2 },
  { id: "payment", paragraphCount: 2 },
  { id: "delivery", paragraphCount: 2 },
  { id: "cancellation", paragraphCount: 2 },
] as const;

export const CANCELLATION_POLICY_SECTION_CONFIG: readonly LegalSectionConfig[] = [
  { id: "overview", paragraphCount: 2 },
  { id: "studentChanges", paragraphCount: 2, bulletCount: 5 },
  { id: "mentorChanges", paragraphCount: 2, bulletCount: 3 },
  { id: "refunds", paragraphCount: 2, bulletCount: 3 },
  { id: "exceptions", paragraphCount: 2 },
] as const;
