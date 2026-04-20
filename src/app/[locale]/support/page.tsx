import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarSync,
  CreditCard,
  MessageSquareWarning,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { SupportRequestForm } from "@/components/support/SupportRequestForm";
import { SECONDARY_PILL_BUTTON_CLASS_NAME } from "@/components/ui/buttonStyles";
import { Link } from "@/i18n/navigation";
import {
  isSupportRequestCategory,
  type SupportRequestCategory,
} from "@/features/support/constants";

type SearchParamValue = string | string[] | undefined;

type SupportPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const SUPPORT_LAST_UPDATED_AT = "2026-04-20T00:00:00.000Z";

const QUICK_ACTIONS: Array<{
  accentClassName: string;
  category: SupportRequestCategory;
  icon: typeof CreditCard;
}> = [
  {
    category: "payment",
    icon: CreditCard,
    accentClassName: "bg-sky-100 text-sky-700",
  },
  {
    category: "schedule_change",
    icon: CalendarSync,
    accentClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    category: "no_response",
    icon: MessageSquareWarning,
    accentClassName: "bg-amber-100 text-amber-700",
  },
  {
    category: "trouble_report",
    icon: AlertTriangle,
    accentClassName: "bg-rose-100 text-rose-700",
  },
];

function formatSupportLastUpdated(locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(SUPPORT_LAST_UPDATED_AT));
}

function resolveInitialCategory(value: SearchParamValue) {
  if (typeof value !== "string") {
    return null;
  }

  return isSupportRequestCategory(value) ? value : null;
}

export async function generateMetadata({
  params,
}: SupportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "support" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SupportPage({
  params,
  searchParams,
}: SupportPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: "support" });
  const initialCategory = resolveInitialCategory(query?.topic);

  return (
    <LegalPageShell
      eyebrow={t("eyebrow")}
      title={t("pageTitle")}
      description={t("pageDescription")}
      lastUpdated={t("lastUpdated", {
        date: formatSupportLastUpdated(locale),
      })}
    >
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_60%,#ffffff_100%)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("quickActions.eyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary">
            {t("quickActions.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
            {t("quickActions.description")}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-secondary shadow-sm">
              <p className="font-semibold text-primary">
                {t("quickActions.points.paymentTitle")}
              </p>
              <p className="mt-1">{t("quickActions.points.paymentDescription")}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-secondary shadow-sm">
              <p className="font-semibold text-primary">
                {t("quickActions.points.scheduleTitle")}
              </p>
              <p className="mt-1">{t("quickActions.points.scheduleDescription")}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 text-sm leading-6 text-secondary shadow-sm">
              <p className="font-semibold text-primary">
                {t("quickActions.points.contactTitle")}
              </p>
              <p className="mt-1">{t("quickActions.points.contactDescription")}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t("selfHelp.eyebrow")}
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-primary">
            {t("selfHelp.title")}
          </h2>
          <p className="mt-3 text-sm leading-7 text-secondary">
            {t("selfHelp.description")}
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/settings?tab=my-lessons"
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-primary transition hover:border-sky-200 hover:bg-sky-50"
            >
              <span>{t("selfHelp.myLessons")}</span>
              <span className="text-sky-700">{t("selfHelp.open")}</span>
            </Link>
            <Link
              href="/settings?tab=messages"
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-primary transition hover:border-sky-200 hover:bg-sky-50"
            >
              <span>{t("selfHelp.messages")}</span>
              <span className="text-sky-700">{t("selfHelp.open")}</span>
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-7 text-secondary">
            <p className="font-semibold text-primary">
              {t("selfHelp.responseWindowTitle")}
            </p>
            <p className="mt-1">{t("selfHelp.responseWindowDescription")}</p>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.category}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.accentClassName}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-xl font-semibold tracking-tight text-primary">
                {t(`categories.${item.category}.label`)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-secondary">
                {t(`categories.${item.category}.description`)}
              </p>
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-secondary">
                <span className="font-semibold text-primary">
                  {t("cards.includeLabel")}
                </span>{" "}
                {t(`categories.${item.category}.hint`)}
              </p>

              <div className="mt-5">
                <a
                  href={`/${locale}/support?topic=${item.category}#request-form`}
                  className={SECONDARY_PILL_BUTTON_CLASS_NAME}
                >
                  {t("cards.cta")}
                </a>
              </div>
            </article>
          );
        })}
      </section>

      <div className="mt-8">
        <SupportRequestForm initialCategory={initialCategory} />
      </div>
    </LegalPageShell>
  );
}
