import {
  LocalizedAuthRedirectPage,
  type RootAuthPageProps,
} from "../LocalizedAuthRedirectPage";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: RootAuthPageProps) {
  return (
    <LocalizedAuthRedirectPage
      searchParams={searchParams}
      pathname="/auth/forgot-password"
    />
  );
}
