import {
  LocalizedAuthRedirectPage,
  type RootAuthPageProps,
} from "../LocalizedAuthRedirectPage";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: RootAuthPageProps) {
  return (
    <LocalizedAuthRedirectPage
      searchParams={searchParams}
      pathname="/auth/reset-password"
    />
  );
}
