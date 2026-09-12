import { describe, expect, it } from "vitest";

import nextConfig from "./next.config";

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
