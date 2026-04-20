import {
  redirectToLocalizedPage,
  type RootLocalizedPageProps,
} from "../../redirectToLocalizedPage";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: RootLocalizedPageProps) {
  return redirectToLocalizedPage({
    searchParams,
    pathname: "/admin/support",
  });
}
