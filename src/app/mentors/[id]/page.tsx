import {
  redirectToLocalizedPage,
  type RootLocalizedPageProps,
} from "../../redirectToLocalizedPage";

export const dynamic = "force-dynamic";

type MentorDetailPageProps = RootLocalizedPageProps & {
  params: Promise<{ id: string }>;
};

export default async function MentorDetailPage({
  params,
  searchParams,
}: MentorDetailPageProps) {
  const { id } = await params;

  return redirectToLocalizedPage({
    searchParams,
    pathname: `/mentors/${id}`,
  });
}
