import { describe, expect, it } from "vitest";

import {
  getCollectionCardDetails,
  getCollectionCardEdition,
} from "./collection";

const release = {
  format: "lp" as const,
  disc_count: 2,
  original_year: 1965,
  release_year: 2020,
  label: "Philips",
  catalog_number: "PHS 600-187",
  country: "US",
};

describe("getCollectionCardDetails", () => {
  it("formats the useful at-a-glance release details", () => {
    expect(getCollectionCardDetails(release)).toEqual([
      "LP",
      "2 discs",
      "2020",
      "US",
    ]);
  });

  it("falls back to the original year and omits a single disc", () => {
    expect(
      getCollectionCardDetails({
        ...release,
        disc_count: 1,
        release_year: null,
        country: null,
      }),
    ).toEqual(["LP", "1965"]);
  });

  it("returns no badges when details are unknown", () => {
    expect(
      getCollectionCardDetails({
        format: null,
        disc_count: null,
        original_year: null,
        release_year: null,
        label: null,
        catalog_number: null,
        country: null,
      }),
    ).toEqual([]);
  });
});

describe("getCollectionCardEdition", () => {
  it("combines label and catalog number", () => {
    expect(getCollectionCardEdition(release)).toBe("Philips · PHS 600-187");
  });

  it("does not add separators around missing values", () => {
    expect(getCollectionCardEdition({ ...release, label: null })).toBe(
      "PHS 600-187",
    );
  });
});
