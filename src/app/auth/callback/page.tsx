import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

type AuthCallbackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const localizedCallbackPath = `/${defaultLocale}/auth/callback`;

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const params = await searchParams;
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => nextSearchParams.append(key, item));
      continue;
    }

    if (typeof value === "string") {
      nextSearchParams.set(key, value);
    }
  }

  const query = nextSearchParams.toString();

  redirect(query ? `${localizedCallbackPath}?${query}` : localizedCallbackPath);
}
