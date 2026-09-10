import { describe, expect, it } from "vitest";

import {
  formatPriceMinor,
  getDuplicateConfirmationValue,
  priceMinorToInput,
  validateCopyDetails,
  validateManualRecord,
  validateRecordDetails,
} from "./record";

const entryKey = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) {
    data.set(name, value);
  }
  return data;
}

describe("validateManualRecord", () => {
  it("accepts and normalizes a complete manual record", () => {
    const result = validateManualRecord(
      formData({
        artist: "  Nina Simone ",
        title: " Pastel Blues ",
        entryKey,
        format: "lp",
        discCount: "1",
        originalYear: "1965",
        releaseYear: "2020",
        label: " Philips ",
        catalogNumber: " PHS 600-187 ",
        country: " US ",
        editionDescription: " Stereo reissue ",
        isReissue: "on",
        vinylColor: " Black ",
        barcode: " 602508910657 ",
        matrixRunout: " A1 600-187 ",
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        artist: "Nina Simone",
        title: "Pastel Blues",
        entryKey,
        format: "lp",
        discCount: 1,
        originalYear: 1965,
        releaseYear: 2020,
        label: "Philips",
        catalogNumber: "PHS 600-187",
        country: "US",
        editionDescription: "Stereo reissue",
        isReissue: true,
        vinylColor: "Black",
        barcode: "602508910657",
        matrixRunout: "A1 600-187",
      },
    });
  });

  it("requires only artist and title", () => {
    const result = validateManualRecord(
      formData({ artist: "Sade", title: "Diamond Life", entryKey }),
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        artist: "Sade",
        title: "Diamond Life",
        format: null,
        discCount: null,
        isReissue: false,
      },
    });
  });

  it("returns specific required-field errors", () => {
    const result = validateManualRecord(formData({ entryKey }));

    expect(result).toEqual({
      success: false,
      errors: {
        artist: "Enter the artist name.",
        title: "Enter the record title.",
      },
    });
  });

  it.each([
    ["format", "cassette", "Choose a valid format."],
    ["discCount", "0", "Disc count must be between 1 and 100."],
    ["originalYear", "nineteen", "Original year must be a whole number."],
    ["releaseYear", "10000", "Edition year must be between 1000 and 9999."],
    ["entryKey", "not-a-uuid", "Refresh the page and try again."],
  ])("rejects invalid %s values", (field, value, message) => {
    const result = validateManualRecord(
      formData({
        artist: "Sade",
        title: "Diamond Life",
        entryKey,
        [field]: value,
      }),
    );

    expect(result).toEqual({
      success: false,
      errors: { [field]: message },
    });
  });

  it("rejects oversized optional metadata", () => {
    const result = validateManualRecord(
      formData({
        artist: "Sade",
        title: "Diamond Life",
        entryKey,
        catalogNumber: "x".repeat(101),
        editionDescription: "x".repeat(1001),
      }),
    );

    expect(result).toEqual({
      success: false,
      errors: {
        catalogNumber: "Catalog number must be 100 characters or fewer.",
        editionDescription:
          "Edition description must be 1000 characters or fewer.",
      },
    });
  });
});

describe("getDuplicateConfirmationValue", () => {
  it("binds confirmation to a normalized artist and title", () => {
    expect(
      getDuplicateConfirmationValue(" Nina   Simone ", " PASTEL Blues "),
    ).toBe(getDuplicateConfirmationValue("nina simone", "pastel blues"));
    expect(
      getDuplicateConfirmationValue("Nina Simone", "Pastel Blues"),
    ).not.toBe(
      getDuplicateConfirmationValue("Nina Simone", "Little Girl Blue"),
    );
  });
});

describe("validateRecordDetails", () => {
  it("validates edits without requiring a create-entry key", () => {
    const result = validateRecordDetails(
      formData({
        artist: "  Sade ",
        title: " Diamond Life ",
        format: "lp",
        releaseYear: "1984",
      }),
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        artist: "Sade",
        title: "Diamond Life",
        format: "lp",
        releaseYear: 1984,
      },
    });
  });
});

describe("validateCopyDetails", () => {
  it("normalizes complete personal-copy details and converts price to minor units", () => {
    const result = validateCopyDetails(
      formData({
        purchaseState: "used",
        mediaCondition: "near_mint",
        sleeveCondition: "very_good_plus",
        acquiredOn: "2026-09-10",
        acquiredFrom: " Local record shop ",
        pricePaid: "24.99",
        priceCurrency: " usd ",
        rating: "5",
        isFavorite: "on",
        notes: " A late-night favorite. ",
        tags: " Jazz,  Sunday   morning, jazz ",
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        purchaseState: "used",
        mediaCondition: "near_mint",
        sleeveCondition: "very_good_plus",
        acquiredOn: "2026-09-10",
        acquiredFrom: "Local record shop",
        pricePaidMinor: 2499,
        priceCurrency: "USD",
        rating: 5,
        isFavorite: true,
        notes: "A late-night favorite.",
        tags: ["Jazz", "Sunday morning"],
      },
    });
  });

  it("accepts an entirely unspecified copy", () => {
    expect(validateCopyDetails(formData({}))).toEqual({
      success: true,
      data: {
        purchaseState: "unknown",
        mediaCondition: null,
        sleeveCondition: null,
        acquiredOn: null,
        acquiredFrom: null,
        pricePaidMinor: null,
        priceCurrency: null,
        rating: null,
        isFavorite: false,
        notes: null,
        tags: [],
      },
    });
  });

  it("validates enums, calendar dates, ratings, and complete prices", () => {
    expect(
      validateCopyDetails(
        formData({
          purchaseState: "vintage",
          mediaCondition: "perfect",
          acquiredOn: "2026-02-30",
          pricePaid: "12.345",
          priceCurrency: "USD",
          rating: "6",
        }),
      ),
    ).toEqual({
      success: false,
      errors: {
        purchaseState: "Choose a valid purchase state.",
        mediaCondition: "Choose a valid media condition.",
        acquiredOn: "Enter a valid acquisition date.",
        pricePaid: "USD supports up to 2 decimal places.",
        rating: "Choose a rating from 1 to 5.",
      },
    });
  });

  it("uses each currency's fraction digits", () => {
    expect(
      validateCopyDetails(
        formData({ pricePaid: "2500", priceCurrency: "JPY" }),
      ),
    ).toMatchObject({ success: true, data: { pricePaidMinor: 2500 } });
    expect(
      validateCopyDetails(
        formData({ pricePaid: "1.234", priceCurrency: "KWD" }),
      ),
    ).toMatchObject({ success: true, data: { pricePaidMinor: 1234 } });
  });

  it("limits tag count and length", () => {
    expect(
      validateCopyDetails(
        formData({
          tags: Array.from({ length: 21 }, (_, index) => `tag ${index}`).join(
            ",",
          ),
        }),
      ),
    ).toEqual({
      success: false,
      errors: { tags: "Add no more than 20 tags." },
    });
    expect(validateCopyDetails(formData({ tags: "x".repeat(51) }))).toEqual({
      success: false,
      errors: { tags: "Each tag must be 50 characters or fewer." },
    });
  });
});

describe("price display conversion", () => {
  it("round-trips standard and zero-decimal currencies", () => {
    expect(priceMinorToInput(2499, "USD")).toBe("24.99");
    expect(priceMinorToInput(2500, "JPY")).toBe("2500");
    expect(formatPriceMinor(2499, "USD")).toBe("$24.99");
  });
});
