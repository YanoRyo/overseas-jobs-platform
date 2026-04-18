import {
  redirectToLocalizedPage,
  type RootLocalizedPageProps,
} from "../../redirectToLocalizedPage";

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  searchParams,
}: RootLocalizedPageProps) {
  return redirectToLocalizedPage({
    searchParams,
    pathname: "/checkout/complete",
  });
}
