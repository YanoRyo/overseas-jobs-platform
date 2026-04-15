import {
  redirectToLocalizedPage,
  type RootLocalizedPageProps,
} from "../redirectToLocalizedPage";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  searchParams,
}: RootLocalizedPageProps) {
  return redirectToLocalizedPage({
    searchParams,
    pathname: "/favorites",
  });
}
