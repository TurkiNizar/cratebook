import { describe, expect, it } from "vitest";

import { getUsernameError, normalizeUsername } from "./profile";

describe("normalizeUsername", () => {
  it("trims and lowercases a username", () => {
    expect(normalizeUsername("  My_Crate  ")).toBe("my_crate");
  });
});

describe("getUsernameError", () => {
  it.each(["abc", "crate-digger", "blue_note_75"])("accepts %s", (username) => {
    expect(getUsernameError(username)).toBeNull();
  });

  it.each(["ab", "-crate", "crate-", "crate space", "éclair"])(
    "rejects malformed username %s",
    (username) => {
      expect(getUsernameError(username)).toMatch(/3–30 letters/);
    },
  );

  it("rejects a reserved route", () => {
    expect(getUsernameError("settings")).toMatch(/reserved/);
  });
});
