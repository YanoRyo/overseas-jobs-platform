import {
  redirectToLocalizedAuthPage,
  type RootAuthPageProps,
} from "../LocalizedAuthRedirectPage";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: RootAuthPageProps) {
  return redirectToLocalizedAuthPage({
    searchParams,
    pathname: "/auth/reset-password",
  });
}
