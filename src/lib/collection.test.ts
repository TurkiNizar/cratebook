import { describe, expect, it } from "vitest";

import {
  formatCollectionDate,
  getCollectionCardDetails,
  getCollectionCardEdition,
  getCopyDetailRows,
  getRecordDetailRows,
  parseCollectionControls,
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

describe("getRecordDetailRows", () => {
  it("labels all known edition metadata for the detail screen", () => {
    expect(
      getRecordDetailRows({
        ...release,
        edition_description: "Stereo reissue",
        is_reissue: true,
        vinyl_color: "Black",
        barcode: "602508910657",
        matrix_runout: "A1 600-187",
      }),
    ).toEqual([
      { label: "Format", value: "LP" },
      { label: "Disc count", value: "2" },
      { label: "Original release year", value: "1965" },
      { label: "This edition's year", value: "2020" },
      { label: "Label", value: "Philips" },
      { label: "Catalog number", value: "PHS 600-187" },
      { label: "Country", value: "US" },
      { label: "Edition description", value: "Stereo reissue" },
      { label: "Reissue", value: "Yes" },
      { label: "Vinyl color", value: "Black" },
      { label: "Barcode", value: "602508910657" },
      { label: "Matrix / runout", value: "A1 600-187" },
    ]);
  });

  it("omits unknown metadata", () => {
    expect(
      getRecordDetailRows({
        format: null,
        disc_count: null,
        original_year: null,
        release_year: null,
        label: null,
        catalog_number: null,
        country: null,
        edition_description: null,
        is_reissue: null,
        vinyl_color: null,
        barcode: null,
        matrix_runout: null,
      }),
    ).toEqual([]);
  });

  it("does not present an unchecked reissue field as a definitive answer", () => {
    expect(
      getRecordDetailRows({
        format: null,
        disc_count: null,
        original_year: null,
        release_year: null,
        label: null,
        catalog_number: null,
        country: null,
        edition_description: null,
        is_reissue: false,
        vinyl_color: null,
        barcode: null,
        matrix_runout: null,
      }),
    ).toEqual([]);
  });
});

describe("formatCollectionDate", () => {
  it("formats stored timestamps without local-time drift", () => {
    expect(formatCollectionDate("2026-09-10T23:30:00+00:00")).toBe(
      "Sep 10, 2026",
    );
  });
});

describe("getCopyDetailRows", () => {
  it("formats personal copy details for private display", () => {
    expect(
      getCopyDetailRows({
        purchase_state: "used",
        media_condition: "near_mint",
        sleeve_condition: "very_good_plus",
        acquired_on: "2026-09-10",
        acquired_from: "Local record shop",
        price_paid_minor: 2499,
        price_currency: "USD",
        rating: 5,
      }),
    ).toEqual([
      { label: "Bought as", value: "Used" },
      { label: "Media condition", value: "Near Mint (NM)" },
      { label: "Sleeve condition", value: "Very Good Plus (VG+)" },
      { label: "Acquired", value: "Sep 10, 2026" },
      { label: "Acquired from", value: "Local record shop" },
      { label: "Price paid", value: "$24.99" },
      { label: "Personal rating", value: "5 / 5" },
    ]);
  });
});

describe("parseCollectionControls", () => {
  it("normalizes valid search, filter, and sort values", () => {
    expect(
      parseCollectionControls({
        q: "  blue note  ",
        favorite: "1",
        purchase: "used",
        format: "lp",
        condition: "near_mint",
        sort: "artist",
      }),
    ).toEqual({
      query: "blue note",
      favorite: true,
      purchaseState: "used",
      format: "lp",
      condition: "near_mint",
      sort: "artist",
      isActive: true,
    });
  });

  it("ignores invalid and repeated values safely", () => {
    expect(
      parseCollectionControls({
        q: ["Sade", "ignored"],
        favorite: "yes",
        purchase: "vintage",
        format: "cassette",
        condition: "perfect",
        sort: "price",
      }),
    ).toEqual({
      query: "Sade",
      favorite: false,
      purchaseState: "",
      format: "",
      condition: "",
      sort: "newest",
      isActive: true,
    });
  });

  it("uses an inactive default state", () => {
    expect(parseCollectionControls({})).toMatchObject({
      query: "",
      favorite: false,
      sort: "newest",
      isActive: false,
    });
  });
});
