import { describe, expect, it } from "vitest";

import { safeInternalPath } from "./navigation";

describe("safeInternalPath", () => {
  it("keeps ordinary internal paths with query strings", () => {
    expect(safeInternalPath("/collection?sort=artist")).toBe(
      "/collection?sort=artist",
    );
  });

  it.each([
    "https://attacker.example/steal",
    "//attacker.example/steal",
    "/\\attacker.example/steal",
    "/%5Cattacker.example/steal",
  ])("rejects external and scheme-relative redirects: %s", (value) => {
    expect(safeInternalPath(value)).toBe("/collection");
  });

  it("uses the requested fallback for missing or malformed values", () => {
    expect(safeInternalPath(null, "/sign-in")).toBe("/sign-in");
    expect(safeInternalPath("not a path", "/sign-in")).toBe("/sign-in");
  });
});
