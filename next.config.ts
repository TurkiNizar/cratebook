import type { NextConfig } from "next";

export const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...SECURITY_HEADERS],
      },
    ];
  },
  images: {
    minimumCacheTTL: 604800,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coverartarchive.org",
        port: "",
        pathname: "/release/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "coverartarchive.org",
        port: "",
        pathname: "/release-group/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "www.coverartarchive.org",
        port: "",
        pathname: "/release/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "www.coverartarchive.org",
        port: "",
        pathname: "/release-group/**",
        search: "",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
