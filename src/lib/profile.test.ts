import { describe, expect, it } from "vitest";

import {
  getProfileUpdateError,
  getUsernameError,
  normalizeUsername,
} from "./profile";

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

describe("getProfileUpdateError", () => {
  const validProfile = {
    username: "blue_note",
    displayName: "Blue Note Listener",
    bio: "Jazz, soul, and records with a story.",
  };

  it("accepts a valid editable profile", () => {
    expect(getProfileUpdateError(validProfile)).toBeNull();
  });

  it("rejects a long display name", () => {
    expect(
      getProfileUpdateError({ ...validProfile, displayName: "x".repeat(81) }),
    ).toMatch(/80 characters/);
  });

  it("rejects a long bio", () => {
    expect(
      getProfileUpdateError({ ...validProfile, bio: "x".repeat(281) }),
    ).toMatch(/280 characters/);
  });
});
