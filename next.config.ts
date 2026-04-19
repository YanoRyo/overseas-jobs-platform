import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https://*.supabase.co https://randomuser.me https://i.pravatar.cc`,
      `frame-src https://js.stripe.com https://hooks.stripe.com`,
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com`,
      `font-src 'self'`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    domains: [
      "randomuser.me",
      "i.pravatar.cc",
      "example.com",
      ...(supabaseHostname ? [supabaseHostname] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
