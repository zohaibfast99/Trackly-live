import type { NextConfig } from "next";

// Baseline security headers applied to every response.
// NOTE: a Content-Security-Policy is intentionally omitted here — it needs
// per-app testing against Kinde, UploadThing and any inline scripts before
// it can be enabled without breaking the app.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Hide the Next.js dev indicator (bottom-corner badge) in development.
  devIndicators: false,
  images:{
    remotePatterns:[{protocol: "https", hostname: "utfs.io"}],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
