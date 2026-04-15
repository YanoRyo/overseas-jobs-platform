import {
  LocalizedAuthRedirectPage,
  type RootAuthPageProps,
} from "../LocalizedAuthRedirectPage";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: RootAuthPageProps) {
  return (
    <LocalizedAuthRedirectPage
      searchParams={searchParams}
      pathname="/auth/login"
    />
  );
}
