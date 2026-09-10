import { describe, expect, it } from "vitest";

import { validateManualRecord } from "./record";

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
