import { SignupForm } from "@/features/auth/components/SignupForm";

type SignupPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return <SignupForm redirect={params?.redirect} />;
}
