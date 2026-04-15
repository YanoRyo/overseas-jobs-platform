import {
  redirectToLocalizedAuthPage,
  type RootAuthPageProps,
} from "../LocalizedAuthRedirectPage";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: RootAuthPageProps) {
  return redirectToLocalizedAuthPage({
    searchParams,
    pathname="/auth/login",
  });
}
