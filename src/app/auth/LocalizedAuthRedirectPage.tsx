import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

export type RootAuthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type LocalizedAuthRedirectPageProps = RootAuthPageProps & {
  pathname: string;
};

export async function redirectToLocalizedAuthPage({
  searchParams,
  pathname,
}: LocalizedAuthRedirectPageProps): Promise<never> {
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
  const localizedPathname = `/${defaultLocale}${pathname}`;

  redirect(query ? `${localizedPathname}?${query}` : localizedPathname);
}
