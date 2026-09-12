import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./musicbrainz", () => ({ musicBrainzCatalogueProvider: {} }));

import { resolveCatalogueSelection } from "./persistence";
import type { CatalogueProvider, CatalogueReleaseCandidate } from "./types";

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
});
