import { AdminOperationsConsole } from "@/features/admin/components/AdminOperationsConsole";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminOperationsConsole defaultTab="reservations" />;
}
