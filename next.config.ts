import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "randomuser.me",
      "i.pravatar.cc",
      "example.com",
      ...(supabaseHostname ? [supabaseHostname] : []),
    ],
  },
};

export default nextConfig;
