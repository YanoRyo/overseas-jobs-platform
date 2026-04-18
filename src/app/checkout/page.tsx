import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  redirect(`/${defaultLocale}/checkout`);
}
