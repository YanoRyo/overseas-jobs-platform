"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useUser } from "@supabase/auth-helpers-react";
import { Link } from "@/i18n/navigation";
import { PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME } from "@/components/ui/buttonStyles";
import {
  SUPPORT_REQUEST_CATEGORY_VALUES,
  SUPPORT_REQUEST_CONTEXT_MAX_LENGTH,
  SUPPORT_REQUEST_EMAIL_MAX_LENGTH,
  SUPPORT_REQUEST_MESSAGE_MAX_LENGTH,
  SUPPORT_REQUEST_NAME_MAX_LENGTH,
  type SupportRequestCategory,
} from "@/features/support/constants";

type SupportRequestFormProps = {
  initialCategory: SupportRequestCategory | null;
};

type SupportRequestErrorCode =
  | "invalid_body"
  | "invalid_category"
  | "invalid_email"
  | "invalid_message"
  | "invalid_name"
  | "submit_failed"
  | "unavailable";

function isValidEmailAddress(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function resolveUserName(user: ReturnType<typeof useUser>) {
  if (!user) {
    return "";
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  if (fullName) {
    return fullName;
  }

  const partialName = [
    typeof user.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name.trim()
      : "",
    typeof user.user_metadata?.last_name === "string"
      ? user.user_metadata.last_name.trim()
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (partialName) {
    return partialName;
  }

  if (typeof user.user_metadata?.name === "string") {
    return user.user_metadata.name.trim();
  }

  return "";
}

export function SupportRequestForm({
  initialCategory,
}: SupportRequestFormProps) {
  const locale = useLocale();
  const t = useTranslations("support");
  const tc = useTranslations("common");
  const user = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<SupportRequestCategory | "">(
    initialCategory ?? ""
  );
  const [context, setContext] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [errorCode, setErrorCode] = useState<SupportRequestErrorCode | null>(
    null
  );
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCategory(initialCategory ?? "");
    setErrorCode(null);
    setSuccess(false);
  }, [initialCategory]);

  useEffect(() => {
    if (!name) {
      const nextName = resolveUserName(user);
      if (nextName) {
        setName(nextName.slice(0, SUPPORT_REQUEST_NAME_MAX_LENGTH));
      }
    }

    if (!email && user?.email) {
      setEmail(user.email.slice(0, SUPPORT_REQUEST_EMAIL_MAX_LENGTH));
    }
  }, [email, name, user]);

  const selectedCategory = category || null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorCode(null);
    setSuccess(false);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    const normalizedMessage = message.trim();
    const normalizedContext = context.trim();

    if (!normalizedName) {
      setErrorCode("invalid_name");
      return;
    }

    if (!normalizedEmail || !isValidEmailAddress(normalizedEmail)) {
      setErrorCode("invalid_email");
      return;
    }

    if (!category) {
      setErrorCode("invalid_category");
      return;
    }

    if (!normalizedMessage) {
      setErrorCode("invalid_message");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          category,
          context: normalizedContext,
          message: normalizedMessage,
          company,
          locale,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { errorCode?: SupportRequestErrorCode; success?: boolean }
        | null;

      if (!response.ok || !payload?.success) {
        setErrorCode(payload?.errorCode ?? "submit_failed");
        return;
      }

      setSuccess(true);
      setContext("");
      setMessage("");
      setCompany("");
    } catch (error) {
      console.error("support request submit failed", error);
      setErrorCode("submit_failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="request-form"
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {t("form.eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-primary">
            {t("form.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
            {t("form.description")}
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
          {t("responseNotice")}
        </div>
      </div>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          <p className="font-semibold">{t("form.successTitle")}</p>
          <p className="mt-1">{t("form.successDescription")}</p>
        </div>
      ) : null}

      {errorCode ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
          {t(`form.errors.${errorCode}`)}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-primary">
            {t("form.fields.name.label")}{" "}
            <span className="text-muted">({tc("required")})</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={SUPPORT_REQUEST_NAME_MAX_LENGTH}
            autoComplete="name"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary shadow-sm outline-none transition focus:border-sky-400"
            placeholder={t("form.fields.name.placeholder")}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-primary">
            {t("form.fields.email.label")}{" "}
            <span className="text-muted">({tc("required")})</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={SUPPORT_REQUEST_EMAIL_MAX_LENGTH}
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary shadow-sm outline-none transition focus:border-sky-400"
            placeholder={t("form.fields.email.placeholder")}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="text-sm font-medium text-primary">
            {t("form.fields.category.label")}{" "}
            <span className="text-muted">({tc("required")})</span>
          </span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SupportRequestCategory | "")
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary shadow-sm outline-none transition focus:border-sky-400"
          >
            <option value="">{t("form.fields.category.placeholder")}</option>
            {SUPPORT_REQUEST_CATEGORY_VALUES.map((option) => (
              <option key={option} value={option}>
                {t(`categories.${option}.label`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-primary">
            {t("form.fields.context.label")}
          </span>
          <input
            type="text"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={SUPPORT_REQUEST_CONTEXT_MAX_LENGTH}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary shadow-sm outline-none transition focus:border-sky-400"
            placeholder={t("form.fields.context.placeholder")}
          />
        </label>
      </div>

      {selectedCategory ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-secondary">
          <span className="font-semibold text-primary">
            {t("form.categoryHintLabel")}
          </span>{" "}
          {t(`categories.${selectedCategory}.hint`)}
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="text-sm font-medium text-primary">
          {t("form.fields.message.label")}{" "}
          <span className="text-muted">({tc("required")})</span>
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={7}
          maxLength={SUPPORT_REQUEST_MESSAGE_MAX_LENGTH}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-primary shadow-sm outline-none transition focus:border-sky-400"
          placeholder={t("form.fields.message.placeholder")}
        />
      </label>

      <label className="sr-only" aria-hidden="true">
        {t("form.fields.company.label")}
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
        />
      </label>

      <p className="mt-4 text-xs leading-6 text-muted">
        {t("form.privacyNotePrefix")}{" "}
        <Link
          href="/privacy"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {t("form.privacyLink")}
        </Link>
        .
      </p>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${PRIMARY_PILL_BUTTON_MEDIUM_CLASS_NAME} w-full justify-center px-6 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
        >
          {isSubmitting ? t("form.submitting") : t("form.submit")}
        </button>
      </div>
    </form>
  );
}
