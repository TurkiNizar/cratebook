import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  CatalogueAlbumCandidate,
  CatalogueAlbumProvider,
  CatalogueCoverResult,
} from "./types";
import { searchAlbumArtwork } from "./artwork";

const candidates: CatalogueAlbumCandidate[] = [
  {
    source: "musicbrainz",
    entityType: "release_group",
    externalId: "11111111-1111-4111-8111-111111111111",
    sourceUrl:
      "https://musicbrainz.org/release-group/11111111-1111-4111-8111-111111111111",
    artist: "Nina Simone",
    title: "Pastel Blues",
    originalYear: 1965,
    representativeCoverUrl:
      "https://coverartarchive.org/release-group/11111111-1111-4111-8111-111111111111/front-500",
    sourceData: { provider: "musicbrainz" },
  },
  {
    source: "musicbrainz",
    entityType: "release_group",
    externalId: "22222222-2222-4222-8222-222222222222",
    sourceUrl:
      "https://musicbrainz.org/release-group/22222222-2222-4222-8222-222222222222",
    artist: "Nina Simone",
    title: "Pastel Blues: Expanded Edition",
    originalYear: 1965,
    representativeCoverUrl:
      "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500",
    sourceData: { provider: "musicbrainz" },
  },
];

function providerWith(
  coverResult: (externalId: string) => CatalogueCoverResult,
): CatalogueAlbumProvider {
  return {
    source: "musicbrainz",
    searchAlbums: vi.fn().mockResolvedValue({
      status: "success",
      candidates,
      pagination: {
        page: 1,
        pageSize: 8,
        totalResults: 2,
        hasNextPage: false,
      },
    }),
    lookupAlbum: vi.fn(),
    getAlbumCover: vi.fn(async (externalId) => coverResult(externalId)),
  };
}

describe("searchAlbumArtwork", () => {
  it("normalizes the query and returns only server-validated cover suggestions", async () => {
    const provider = providerWith((externalId) =>
      externalId === candidates[0].externalId
        ? {
            status: "success",
            coverUrl: `${candidates[0].representativeCoverUrl}`,
            originalUrl: `https://coverartarchive.org/release-group/${externalId}/front`,
          }
        : { status: "no_art" },
    );

    const result = await searchAlbumArtwork(
      "  Nina   Simone ",
      " Pastel   Blues ",
      provider,
    );

    expect(provider.searchAlbums).toHaveBeenCalledWith(
      "Nina Simone Pastel Blues",
      { page: 1, pageSize: 8 },
    );
    expect(result.status).toBe("success");
    expect(result.suggestions).toEqual([
      expect.objectContaining({
        externalId: candidates[0].externalId,
        title: "Pastel Blues",
        originalYear: 1965,
      }),
    ]);
  });

  it("keeps manual entry available for invalid input, missing art, and provider failure", async () => {
    await expect(searchAlbumArtwork("", "Pastel Blues")).resolves.toEqual(
      expect.objectContaining({ status: "invalid_query", suggestions: [] }),
    );

    const noArt = await searchAlbumArtwork(
      "Nina Simone",
      "Pastel Blues",
      providerWith(() => ({ status: "no_art" })),
    );
    expect(noArt).toEqual(
      expect.objectContaining({ status: "no_art", suggestions: [] }),
    );

    const unavailable = await searchAlbumArtwork(
      "Nina Simone",
      "Pastel Blues",
      providerWith(() => ({ status: "unavailable" })),
    );
    expect(unavailable).toEqual(
      expect.objectContaining({ status: "unavailable", suggestions: [] }),
    );
  });
});
