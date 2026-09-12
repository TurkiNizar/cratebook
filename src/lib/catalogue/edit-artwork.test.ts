import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./musicbrainz", () => ({ musicBrainzCatalogueProvider: {} }));

import type { CatalogueAlbumProvider } from "./types";
import { resolveArtworkEdit, validateArtworkEdit } from "./edit-artwork";

const ID = "11111111-1111-4111-8111-111111111111";

function replacement(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    artworkAction: "replace",
    catalogueId: ID,
    catalogueCoverUrl: `https://coverartarchive.org/release-group/${ID}/front-500`,
    catalogueCoverOriginalUrl: `https://coverartarchive.org/release-group/${ID}/front`,
    ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("validateArtworkEdit", () => {
  it("keeps or explicitly removes artwork without provenance input", () => {
    expect(validateArtworkEdit(new FormData())).toEqual({
      success: true,
      data: { action: "keep" },
    });
    const remove = new FormData();
    remove.set("artworkAction", "remove");
    expect(validateArtworkEdit(remove)).toEqual({
      success: true,
      data: { action: "remove" },
    });
  });

  it("verifies concrete representative-release artwork for the selected album", async () => {
    const releaseId = "33333333-3333-4333-8333-333333333333";
    const formData = replacement({
      catalogueCoverUrl: `https://coverartarchive.org/release/${releaseId}/front-500`,
      catalogueCoverOriginalUrl: `https://coverartarchive.org/release/${releaseId}/front`,
    });
    const provider = {
      source: "musicbrainz",
      searchAlbums: vi.fn(),
      lookupAlbum: vi.fn(),
      getAlbumCover: vi.fn(async () => ({
        status: "success" as const,
        coverUrl: `https://coverartarchive.org/release/${releaseId}/front-500`,
        originalUrl: `https://coverartarchive.org/release/${releaseId}/front`,
      })),
    } satisfies CatalogueAlbumProvider;

    await expect(resolveArtworkEdit(formData, provider)).resolves.toMatchObject(
      {
        success: true,
        data: { action: "replace" },
      },
    );
    expect(provider.getAlbumCover).toHaveBeenCalledWith(ID);
  });

  it("does not accept stale artwork when the provider fails verification", async () => {
    const provider = {
      source: "musicbrainz",
      searchAlbums: vi.fn(),
      lookupAlbum: vi.fn(),
      getAlbumCover: vi.fn(async () => ({ status: "unavailable" as const })),
    } satisfies CatalogueAlbumProvider;

    await expect(resolveArtworkEdit(replacement(), provider)).resolves.toEqual({
      success: false,
      message:
        "That artwork selection could not be verified. Find the artwork again or keep the current cover.",
    });
  });

  it("builds bounded, independent provenance for a valid replacement", () => {
    const result = validateArtworkEdit(replacement());
    expect(result).toMatchObject({
      success: true,
      data: {
        action: "replace",
        coverUrl: `https://coverartarchive.org/release-group/${ID}/front-500`,
        artworkData: {
          provider: "musicbrainz",
          entityType: "release_group",
          releaseGroup: { id: ID },
        },
      },
    });
    expect(JSON.stringify(result).length).toBeLessThan(8192);
  });

  it("rejects unsafe hosts and oversized URLs", () => {
    expect(
      validateArtworkEdit(
        replacement({
          catalogueCoverUrl: `https://example.com/release-group/${ID}/front-500`,
        }),
      ).success,
    ).toBe(false);
    expect(
      validateArtworkEdit(
        replacement({
          catalogueCoverOriginalUrl: `https://coverartarchive.org/release-group/${ID}/${"x".repeat(9000)}`,
        }),
      ).success,
    ).toBe(false);
  });
});
