import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
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
