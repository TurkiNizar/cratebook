import { describe, expect, it } from "vitest";

import {
  candidateToRecordFormValues,
  candidateToWishlistFormValues,
} from "./forms";
import type { CatalogueReleaseCandidate } from "./types";

const candidate: CatalogueReleaseCandidate = {
  source: "musicbrainz",
  entityType: "release",
  externalId: "11111111-1111-4111-8111-111111111111",
  sourceUrl:
    "https://musicbrainz.org/release/11111111-1111-4111-8111-111111111111",
  artist: "Alice Coltrane",
  title: "Journey in Satchidananda",
  format: "lp",
  discCount: 1,
  originalYear: 1971,
  releaseYear: 2022,
  label: "Impulse!",
  catalogNumber: "AS-9203",
  country: "US",
  editionDescription: "Stereo reissue",
  barcode: "012345678905",
  sourceData: { provider: "musicbrainz" },
};

describe("catalogue form values", () => {
  it("prefills release metadata without inventing copy-specific facts", () => {
    expect(candidateToRecordFormValues(candidate)).toEqual(
      expect.objectContaining({
        artist: "Alice Coltrane",
        title: "Journey in Satchidananda",
        format: "lp",
        discCount: "1",
        originalYear: "1971",
        releaseYear: "2022",
        label: "Impulse!",
        catalogNumber: "AS-9203",
        country: "US",
        editionDescription: "Stereo reissue",
        barcode: "012345678905",
        purchaseState: "unknown",
        acquiredFrom: "",
        pricePaid: "",
        notes: "",
        isReissue: false,
      }),
    );
  });

  it("prefills only safe wishlist fields and preserves private defaults", () => {
    expect(candidateToWishlistFormValues(candidate)).toEqual({
      artist: "Alice Coltrane",
      title: "Journey in Satchidananda",
      priority: "interested",
      preferredEdition: "Stereo reissue",
      maxPrice: "",
      priceCurrency: "",
      notes: "",
      isPublic: false,
    });
  });
});
