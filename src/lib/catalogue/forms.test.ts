import { describe, expect, it } from "vitest";

import {
  candidateToRecordFormValues,
  candidateToWishlistFormValues,
  albumCandidateToRecordFormValues,
  albumCandidateToWishlistFormValues,
} from "./forms";
import type {
  CatalogueAlbumCandidate,
  CatalogueReleaseCandidate,
} from "./types";

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

const albumCandidate: CatalogueAlbumCandidate = {
  source: "musicbrainz",
  entityType: "release_group",
  externalId: "22222222-2222-4222-8222-222222222222",
  sourceUrl:
    "https://musicbrainz.org/release-group/22222222-2222-4222-8222-222222222222",
  artist: "Alice Coltrane",
  title: "Journey in Satchidananda",
  originalYear: 1971,
  representativeCoverUrl:
    "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500",
  sourceData: { provider: "musicbrainz", entityType: "release_group" },
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

  it("prefills album identity without inventing edition or copy details", () => {
    expect(albumCandidateToRecordFormValues(albumCandidate)).toEqual(
      expect.objectContaining({
        artist: "Alice Coltrane",
        title: "Journey in Satchidananda",
        originalYear: "1971",
        format: "",
        releaseYear: "",
        editionDescription: "",
        purchaseState: "unknown",
        acquiredFrom: "",
        pricePaid: "",
      }),
    );
    expect(albumCandidateToWishlistFormValues(albumCandidate)).toEqual({
      artist: "Alice Coltrane",
      title: "Journey in Satchidananda",
      priority: "interested",
      preferredEdition: "",
      maxPrice: "",
      priceCurrency: "",
      notes: "",
      isPublic: false,
    });
  });
});
