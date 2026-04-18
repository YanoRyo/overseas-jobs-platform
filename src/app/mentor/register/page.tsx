import {
  redirectToLocalizedPage,
  type RootLocalizedPageProps,
} from "../../redirectToLocalizedPage";

export const dynamic = "force-dynamic";

export default async function MentorRegisterPage({
  searchParams,
}: RootLocalizedPageProps) {
  return redirectToLocalizedPage({
    searchParams,
    pathname: "/mentor/register",
  });
}
