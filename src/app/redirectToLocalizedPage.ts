import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

type SearchParamValue = string | string[] | undefined;

export type RootLocalizedPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

type RedirectToLocalizedPageOptions = RootLocalizedPageProps & {
  pathname: string;
};

export async function redirectToLocalizedPage({
  pathname,
  searchParams,
}: RedirectToLocalizedPageOptions): Promise<never> {
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
