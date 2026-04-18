import { AdminOperationsConsole } from "@/features/admin/components/AdminOperationsConsole";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return <AdminOperationsConsole defaultTab="payments" />;
}
