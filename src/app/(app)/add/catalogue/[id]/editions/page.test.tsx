import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CatalogueAlbumCandidate,
  CatalogueReleaseCandidate,
} from "@/lib/catalogue/types";

const { lookupAlbum, searchAlbumEditions } = vi.hoisted(() => ({
  lookupAlbum: vi.fn(),
  searchAlbumEditions: vi.fn(),
}));

vi.mock("@/lib/catalogue/musicbrainz", () => ({
  musicBrainzCatalogueProvider: { lookupAlbum, searchAlbumEditions },
}));

import CatalogueEditionsPage from "./page";

const albumId = "22222222-2222-4222-8222-222222222222";
const releaseId = "11111111-1111-4111-8111-111111111111";
const album: CatalogueAlbumCandidate = {
  source: "musicbrainz",
  entityType: "release_group",
  externalId: albumId,
  sourceUrl: `https://musicbrainz.org/release-group/${albumId}`,
  artist: "Miles Davis",
  title: "Kind of Blue",
  originalYear: 1959,
  representativeCoverUrl: `https://coverartarchive.org/release-group/${albumId}/front-500`,
  sourceData: { provider: "musicbrainz" },
};
const edition: CatalogueReleaseCandidate = {
  source: "musicbrainz",
  entityType: "release",
  externalId: releaseId,
  sourceUrl: `https://musicbrainz.org/release/${releaseId}`,
  artist: "Miles Davis",
  title: "Kind of Blue",
  format: "lp",
  discCount: 1,
  originalYear: 1959,
  releaseYear: 2013,
  label: "Music On Vinyl",
  catalogNumber: "MOVLP 019",
  country: "EU",
  editionDescription: "180 gram blue vinyl reissue",
  barcode: null,
  sourceData: { provider: "musicbrainz" },
};

describe("CatalogueEditionsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    lookupAlbum.mockResolvedValue({ status: "success", candidate: album });
  });

  it("keeps album quick-add primary while listing exact editions", async () => {
    searchAlbumEditions.mockResolvedValue({
      status: "success",
      candidates: [edition],
      pagination: {
        page: 1,
        pageSize: 12,
        totalResults: 13,
        hasNextPage: true,
      },
    });

    render(
      await CatalogueEditionsPage({
        params: Promise.resolve({ id: albumId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Choose a specific edition" }),
    ).toBeVisible();
    expect(screen.getByText(/Kind of Blue by Miles Davis/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Add album to collection" }),
    ).toHaveAttribute("href", `/add/manual?catalogueAlbumId=${albumId}`);
    expect(
      screen.getByRole("link", { name: "Add album to wishlist" }),
    ).toHaveAttribute("href", `/wishlist/add?catalogueAlbumId=${albumId}`);
    expect(
      screen.getByRole("heading", { name: "13 vinyl editions" }),
    ).toBeVisible();
    expect(screen.getByText("MOVLP 019")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review release" }),
    ).toHaveAttribute("href", `/add/catalogue/${releaseId}?albumId=${albumId}`);
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      `/add/catalogue/${albumId}/editions?page=2`,
    );
  });

  it("keeps album entry available when no exact edition is found", async () => {
    searchAlbumEditions.mockResolvedValue({ status: "no_results" });

    render(
      await CatalogueEditionsPage({
        params: Promise.resolve({ id: albumId }),
        searchParams: Promise.resolve({ page: "invalid" }),
      }),
    );

    expect(searchAlbumEditions).toHaveBeenCalledWith(albumId, { page: 1 });
    expect(
      screen.getByRole("heading", { name: "No vinyl editions were found" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Add album to collection" }),
    ).toBeVisible();
  });

  it("shows recoverable provider failure without removing album quick-add", async () => {
    searchAlbumEditions.mockResolvedValue({ status: "unavailable" });

    render(
      await CatalogueEditionsPage({
        params: Promise.resolve({ id: albumId }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "We could not load specific editions",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      `/add/catalogue/${albumId}/editions`,
    );
    expect(
      screen.getByRole("link", { name: "Add album to wishlist" }),
    ).toBeVisible();
  });
});
