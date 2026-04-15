import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
  // 1. next-intl: locale検出・リダイレクト
  const intlResponse = intlMiddleware(req);

  // リダイレクトの場合はそのまま返す
  if (intlResponse.headers.get("location") || intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // 2. locale prefixを除去してパス取得
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split("/");
  const locale = segments[1]; // 'en' or 'ja'
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  // 3. Supabase認証チェック（@supabase/ssr使用）
  const res = NextResponse.next({
    request: req,
    headers: intlResponse.headers,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = pathWithoutLocale.startsWith("/auth");
  const isProtected = ["/checkout", "/dashboard", "/protected", "/admin", "/settings"].some(
    (path) => pathWithoutLocale.startsWith(path)
  );

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/auth/login`, req.url);
    loginUrl.searchParams.set("redirect", pathWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
