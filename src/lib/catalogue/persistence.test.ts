import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./musicbrainz", () => ({ musicBrainzCatalogueProvider: {} }));

import {
  resolveCatalogueAlbumSelection,
  resolveCatalogueSelection,
} from "./persistence";
import type {
  CatalogueAlbumCandidate,
  CatalogueAlbumProvider,
  CatalogueProvider,
  CatalogueReleaseCandidate,
} from "./types";

const externalId = "11111111-1111-4111-8111-111111111111";
const candidate: CatalogueReleaseCandidate = {
  source: "musicbrainz",
  entityType: "release",
  externalId,
  sourceUrl: `https://musicbrainz.org/release/${externalId}`,
  artist: "Miles Davis",
  title: "Kind of Blue",
  format: "lp",
  discCount: 1,
  originalYear: 1959,
  releaseYear: 1959,
  label: "Columbia",
  catalogNumber: "CS 8163",
  country: "US",
  editionDescription: "Stereo edition",
  barcode: "012345678905",
  sourceData: { provider: "musicbrainz", release: { id: externalId } },
};
const albumId = "22222222-2222-4222-8222-222222222222";
const albumCandidate: CatalogueAlbumCandidate = {
  source: "musicbrainz",
  entityType: "release_group",
  externalId: albumId,
  sourceUrl: `https://musicbrainz.org/release-group/${albumId}`,
  artist: "Miles Davis",
  title: "Kind of Blue",
  originalYear: 1959,
  representativeCoverUrl: `https://coverartarchive.org/release-group/${albumId}/front-500`,
  sourceData: {
    provider: "musicbrainz",
    entityType: "release_group",
    releaseGroup: { id: albumId },
  },
};

function provider(
  overrides: Partial<CatalogueProvider> = {},
): CatalogueProvider {
  return {
    source: "musicbrainz",
    search: vi.fn<CatalogueProvider["search"]>(),
    lookup: vi.fn<CatalogueProvider["lookup"]>(async () => ({
      status: "success",
      candidate,
    })),
    getCover: vi.fn<CatalogueProvider["getCover"]>(async () => ({
      status: "no_art",
    })),
    ...overrides,
  };
}

function albumProvider(
  overrides: Partial<CatalogueAlbumProvider> = {},
): CatalogueAlbumProvider {
  return {
    source: "musicbrainz",
    searchAlbums: vi.fn<CatalogueAlbumProvider["searchAlbums"]>(),
    lookupAlbum: vi.fn<CatalogueAlbumProvider["lookupAlbum"]>(async () => ({
      status: "success",
      candidate: albumCandidate,
    })),
    getAlbumCover: vi.fn<CatalogueAlbumProvider["getAlbumCover"]>(async () => ({
      status: "no_art",
    })),
    ...overrides,
  };
}

describe("catalogue persistence", () => {
  it("resolves server-verified metadata and retains cover provenance", async () => {
    const catalogue = provider({
      getCover: vi.fn<CatalogueProvider["getCover"]>(async () => ({
        status: "success",
        coverUrl: `https://coverartarchive.org/release/${externalId}/front-500`,
        originalUrl: `https://coverartarchive.org/release/${externalId}/front`,
      })),
    });

    await expect(
      resolveCatalogueSelection(externalId, { provider: catalogue }),
    ).resolves.toEqual({
      status: "success",
      release: expect.objectContaining({
        externalId,
        coverUrl: `https://coverartarchive.org/release/${externalId}/front-500`,
        sourceData: expect.objectContaining({
          provider: "musicbrainz",
          coverArt: {
            thumbnailUrl: `https://coverartarchive.org/release/${externalId}/front-500`,
            originalUrl: `https://coverartarchive.org/release/${externalId}/front`,
          },
        }),
      }),
    });
  });

  it("keeps artwork optional while preserving the source snapshot", async () => {
    const result = await resolveCatalogueSelection(externalId, {
      provider: provider(),
    });

    expect(result).toMatchObject({
      status: "success",
      release: {
        coverUrl: null,
        sourceData: { provider: "musicbrainz", coverArt: null },
      },
    });
  });

  it("refuses persistence when the exact release cannot be verified", async () => {
    const catalogue = provider({
      lookup: vi.fn<CatalogueProvider["lookup"]>(async () => ({
        status: "unavailable",
      })),
    });

    await expect(
      resolveCatalogueSelection(externalId, { provider: catalogue }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("rejects a provider response for a different release identifier", async () => {
    const catalogue = provider({
      lookup: vi.fn<CatalogueProvider["lookup"]>(async () => ({
        status: "success",
        candidate: {
          ...candidate,
          externalId: "22222222-2222-4222-8222-222222222222",
        },
      })),
    });

    await expect(
      resolveCatalogueSelection(externalId, { provider: catalogue }),
    ).resolves.toEqual({ status: "unavailable" });
  });

  it("retains a previously verified cover without repeating the artwork request", async () => {
    const catalogue = provider();
    const coverUrl = `https://coverartarchive.org/release/${externalId}/front-500`;
    const originalUrl = `https://coverartarchive.org/release/${externalId}/front`;

    await expect(
      resolveCatalogueSelection(externalId, {
        provider: catalogue,
        selectedCover: { coverUrl, originalUrl },
      }),
    ).resolves.toMatchObject({
      status: "success",
      release: {
        coverUrl,
        sourceData: {
          coverArt: { thumbnailUrl: coverUrl, originalUrl },
        },
      },
    });
    expect(catalogue.getCover).not.toHaveBeenCalled();
  });

  it("rejects a carried cover for another release and safely refetches artwork", async () => {
    const catalogue = provider();

    await expect(
      resolveCatalogueSelection(externalId, {
        provider: catalogue,
        selectedCover: {
          coverUrl:
            "https://coverartarchive.org/release/22222222-2222-4222-8222-222222222222/front-500",
          originalUrl:
            "https://coverartarchive.org/release/22222222-2222-4222-8222-222222222222/front",
        },
      }),
    ).resolves.toMatchObject({
      status: "success",
      release: { coverUrl: null },
    });
    expect(catalogue.getCover).toHaveBeenCalledWith(externalId);
  });

  it("resolves album identity and representative artwork without inventing edition data", async () => {
    const coverUrl = `https://coverartarchive.org/release-group/${albumId}/front-500`;
    const originalUrl = `https://coverartarchive.org/release-group/${albumId}/front`;
    const catalogue = albumProvider({
      getAlbumCover: vi.fn<CatalogueAlbumProvider["getAlbumCover"]>(
        async () => ({ status: "success", coverUrl, originalUrl }),
      ),
    });

    await expect(
      resolveCatalogueAlbumSelection(albumId, { provider: catalogue }),
    ).resolves.toEqual({
      status: "success",
      release: expect.objectContaining({
        entityType: "release_group",
        externalId: albumId,
        artist: "Miles Davis",
        title: "Kind of Blue",
        originalYear: 1959,
        coverUrl,
        format: null,
        releaseYear: null,
        editionDescription: null,
        sourceData: expect.objectContaining({
          provider: "musicbrainz",
          entityType: "release_group",
          releaseGroup: { id: albumId },
          coverArt: { thumbnailUrl: coverUrl, originalUrl },
        }),
      }),
    });
  });

  it("rejects mismatched album identity and carried exact-release artwork", async () => {
    const catalogue = albumProvider({
      lookupAlbum: vi.fn<CatalogueAlbumProvider["lookupAlbum"]>(async () => ({
        status: "success",
        candidate: { ...albumCandidate, externalId },
      })),
    });

    await expect(
      resolveCatalogueAlbumSelection(albumId, {
        provider: catalogue,
        selectedCover: {
          coverUrl: `https://coverartarchive.org/release/${albumId}/front-500`,
          originalUrl: `https://coverartarchive.org/release/${albumId}/front`,
        },
      }),
    ).resolves.toEqual({ status: "unavailable" });
    expect(catalogue.getAlbumCover).toHaveBeenCalledWith(albumId);
  });
});
