import { describe, expect, it } from "vitest";

import {
  getWishlistPriorityLabel,
  validateManualWishlist,
  validateWishlistConversion,
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

describe("validateWishlistConversion", () => {
  it("accepts copy details and an idempotency key", () => {
    expect(
      validateWishlistConversion(
        formData({
          entryKey,
          purchaseState: "used",
          mediaCondition: "near_mint",
          acquiredOn: "2026-09-10",
          pricePaid: "60.00",
          priceCurrency: "usd",
          notes: "Check the sleeve. Found a clean copy.",
          tags: "Jazz, Spiritual jazz, jazz",
        }),
      ),
    ).toEqual({
      success: true,
      data: expect.objectContaining({
        entryKey,
        purchaseState: "used",
        mediaCondition: "near_mint",
        acquiredOn: "2026-09-10",
        pricePaidMinor: 6000,
        priceCurrency: "USD",
        notes: "Check the sleeve. Found a clean copy.",
        tags: ["Jazz", "Spiritual jazz"],
      }),
    });
  });

  it("rejects invalid copy details and a missing idempotency key together", () => {
    expect(
      validateWishlistConversion(
        formData({
          purchaseState: "borrowed",
          pricePaid: "12.999",
          priceCurrency: "USD",
        }),
      ),
    ).toEqual({
      success: false,
      errors: expect.objectContaining({
        entryKey: "Refresh the page and try again.",
        purchaseState: "Choose a valid purchase state.",
        pricePaid: "USD supports up to 2 decimal places.",
      }),
    });
  });
});

describe("getWishlistPriorityLabel", () => {
  it("uses friendly priority labels", () => {
    expect(getWishlistPriorityLabel("must_have")).toBe("Must-have");
  });
});
