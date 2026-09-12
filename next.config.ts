import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coverartarchive.org",
        pathname: "/release/**",
      },
      {
        protocol: "https",
        hostname: "coverartarchive.org",
        pathname: "/release-group/**",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
