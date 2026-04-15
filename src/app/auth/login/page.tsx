import { LoginForm } from "@/features/auth/components/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginForm redirect={params?.redirect} />;
}
