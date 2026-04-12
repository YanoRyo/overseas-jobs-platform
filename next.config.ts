import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "randomuser.me",
      "i.pravatar.cc",
      "example.com",
      ...(supabaseHostname ? [supabaseHostname] : []),
    ],
  },
};

export default withNextIntl(nextConfig);
