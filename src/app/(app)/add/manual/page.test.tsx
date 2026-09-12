import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  CatalogueAlbumCandidate,
  CatalogueReleaseCandidate,
} from "@/lib/catalogue/types";

const { getAlbumCover, getCover, lookup, lookupAlbum } = vi.hoisted(() => ({
  getAlbumCover: vi.fn(),
  getCover: vi.fn(),
  lookup: vi.fn(),
  lookupAlbum: vi.fn(),
}));

vi.mock("@/lib/catalogue/musicbrainz", () => ({
  musicBrainzCatalogueProvider: {
    getAlbumCover,
    getCover,
    lookup,
    lookupAlbum,
  },
}));
vi.mock("./actions", () => ({
  createManualRecord: vi.fn(),
}));
vi.mock("../../artwork-actions", () => ({
  findAlbumArtwork: vi.fn(),
}));

import ManualRecordPage from "./page";

const externalId = "11111111-1111-4111-8111-111111111111";
const coverUrl = `https://coverartarchive.org/release/${externalId}/front-500`;
const originalUrl = `https://coverartarchive.org/release/${externalId}/front`;
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
  sourceData: { provider: "musicbrainz" },
};
const albumCandidate: CatalogueAlbumCandidate = {
  source: "musicbrainz",
  entityType: "release_group",
  externalId: "22222222-2222-4222-8222-222222222222",
  sourceUrl:
    "https://musicbrainz.org/release-group/22222222-2222-4222-8222-222222222222",
  artist: "Miles Davis",
  title: "Kind of Blue",
  originalYear: 1959,
  representativeCoverUrl:
    "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500",
  sourceData: { provider: "musicbrainz", entityType: "release_group" },
};

describe("ManualRecordPage", () => {
  it("carries validated review artwork into the collection form without refetching it", async () => {
    lookup.mockResolvedValue({ status: "success", candidate });

    const { container } = render(
      await ManualRecordPage({
        searchParams: Promise.resolve({
          catalogueId: externalId,
          coverUrl,
          coverOriginalUrl: originalUrl,
        }),
      }),
    );

    expect(
      container.querySelector('input[name="catalogueCoverUrl"]'),
    ).toHaveValue(coverUrl);
    expect(
      container.querySelector('input[name="catalogueCoverOriginalUrl"]'),
    ).toHaveValue(originalUrl);
    expect(getCover).not.toHaveBeenCalled();
  });

  it("prefills safe album fields while leaving pressing and copy details optional", async () => {
    const albumCover = {
      status: "success" as const,
      coverUrl: `${albumCandidate.representativeCoverUrl}`,
      originalUrl: `https://coverartarchive.org/release-group/${albumCandidate.externalId}/front`,
    };
    lookupAlbum.mockResolvedValue({
      status: "success",
      candidate: albumCandidate,
    });
    getAlbumCover.mockResolvedValue(albumCover);

    const { container } = render(
      await ManualRecordPage({
        searchParams: Promise.resolve({
          catalogueAlbumId: albumCandidate.externalId,
        }),
      }),
    );

    expect(container.querySelector('input[name="artist"]')).toHaveValue(
      "Miles Davis",
    );
    expect(container.querySelector('input[name="title"]')).toHaveValue(
      "Kind of Blue",
    );
    expect(container.querySelector('input[name="originalYear"]')).toHaveValue(
      1959,
    );
    expect(container.querySelector('input[name="catalogueId"]')).toHaveValue(
      albumCandidate.externalId,
    );
    expect(
      container.querySelector('input[name="catalogueEntityType"]'),
    ).toHaveValue("release_group");
    expect(
      container.querySelector('input[name="catalogueCoverUrl"]'),
    ).toHaveValue(albumCover.coverUrl);
    expect(container.querySelector('select[name="format"]')).toHaveValue("");
  });
});
