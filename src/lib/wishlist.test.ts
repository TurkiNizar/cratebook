import { describe, expect, it } from "vitest";

import {
  getWishlistPriorityLabel,
  validateManualWishlist,
  validateWishlist,
} from "./wishlist";

const entryKey = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) {
    data.set(name, value);
  }
  return data;
}

describe("validateManualWishlist", () => {
  it("normalizes a complete wishlist entry and converts its target price", () => {
    expect(
      validateManualWishlist(
        formData({
          artist: "  Alice Coltrane ",
          title: " Journey in Satchidananda ",
          entryKey,
          priority: "must_have",
          preferredEdition: " Impulse stereo pressing ",
          maxPrice: "75.00",
          priceCurrency: " usd ",
          notes: " Check the sleeve. ",
          isPublic: "on",
        }),
      ),
    ).toEqual({
      success: true,
      data: {
        artist: "Alice Coltrane",
        title: "Journey in Satchidananda",
        entryKey,
        priority: "must_have",
        preferredEdition: "Impulse stereo pressing",
        maxPriceMinor: 7500,
        priceCurrency: "USD",
        notes: "Check the sleeve.",
        isPublic: true,
      },
    });
  });

  it("requires only artist, title, and a valid entry key", () => {
    expect(
      validateManualWishlist(
        formData({ artist: "Sade", title: "Diamond Life", entryKey }),
      ),
    ).toMatchObject({
      success: true,
      data: {
        priority: "interested",
        preferredEdition: null,
        maxPriceMinor: null,
        isPublic: false,
      },
    });
  });

  it("returns specific errors for invalid fields", () => {
    expect(
      validateManualWishlist(
        formData({
          artist: "",
          title: "",
          entryKey: "invalid",
          priority: "urgent",
          maxPrice: "12.345",
          priceCurrency: "USD",
        }),
      ),
    ).toEqual({
      success: false,
      errors: {
        artist: "Enter the artist name.",
        title: "Enter the record title.",
        priority: "Choose a valid priority.",
        maxPrice: "USD supports up to 2 decimal places.",
        entryKey: "Refresh the page and try again.",
      },
    });
  });
});

describe("validateWishlist", () => {
  it("validates edits without an entry key and supports currency fractions", () => {
    expect(
      validateWishlist(
        formData({
          artist: "Sade",
          title: "Diamond Life",
          maxPrice: "2500",
          priceCurrency: "JPY",
        }),
      ),
    ).toMatchObject({ success: true, data: { maxPriceMinor: 2500 } });
  });

  it("requires complete prices and bounded notes", () => {
    expect(
      validateWishlist(
        formData({
          artist: "Sade",
          title: "Diamond Life",
          priceCurrency: "EUR",
          preferredEdition: "x".repeat(1001),
          notes: "x".repeat(10001),
        }),
      ),
    ).toEqual({
      success: false,
      errors: {
        maxPrice: "Enter a maximum price or clear the currency.",
        preferredEdition: "Preferred edition must be 1000 characters or fewer.",
        notes: "Notes must be 10000 characters or fewer.",
      },
    });
  });
});

describe("getWishlistPriorityLabel", () => {
  it("uses friendly priority labels", () => {
    expect(getWishlistPriorityLabel("must_have")).toBe("Must-have");
  });
});
