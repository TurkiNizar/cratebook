import { describe, expect, it } from "vitest";

import nextConfig, { SECURITY_HEADERS } from "./next.config";

describe("Next.js image configuration", () => {
  it("optimizes and caches both Cover Art Archive entity URL shapes", () => {
    expect(nextConfig.images?.unoptimized).not.toBe(true);
    expect(nextConfig.images?.minimumCacheTTL).toBe(60 * 60 * 24 * 7);
    for (const hostname of ["coverartarchive.org", "www.coverartarchive.org"]) {
      expect(nextConfig.images?.remotePatterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            protocol: "https",
            hostname,
            port: "",
            pathname: "/release/**",
            search: "",
          }),
          expect.objectContaining({
            protocol: "https",
            hostname,
            port: "",
            pathname: "/release-group/**",
            search: "",
          }),
        ]),
      );
    }
  });
});

describe("Next.js security headers", () => {
  it("applies defensive browser policies to every route", async () => {
    const rules = await nextConfig.headers?.();

    expect(rules).toEqual([
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ]);
    expect(
      Object.fromEntries(
        SECURITY_HEADERS.map(({ key, value }) => [key, value]),
      ),
    ).toMatchObject({
      "Content-Security-Policy": expect.stringContaining(
        "frame-ancestors 'none'",
      ),
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-DNS-Prefetch-Control": "off",
      "X-Frame-Options": "DENY",
    });
  });
});
