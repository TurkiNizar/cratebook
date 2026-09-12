import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogueReleaseCandidate } from "@/lib/catalogue/types";

const { getCover, lookup } = vi.hoisted(() => ({
  getCover: vi.fn(),
  lookup: vi.fn(),
}));

vi.mock("@/lib/catalogue/musicbrainz", () => ({
  musicBrainzCatalogueProvider: { getCover, lookup },
}));

import CatalogueReleasePage from "./page";

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
  sourceData: { provider: "musicbrainz" },
};

describe("CatalogueReleasePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("keeps a manual path available when exact release lookup fails", async () => {
    lookup.mockResolvedValue({ status: "unavailable" });
    getCover.mockResolvedValue({ status: "unavailable" });

    render(
      await CatalogueReleasePage({
        params: Promise.resolve({ id: externalId }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "We could not review this release" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      `/add/catalogue/${externalId}`,
    );
    expect(screen.getByRole("link", { name: "Add manually" })).toHaveAttribute(
      "href",
      "/add/manual",
    );
  });

  it("allows selection when optional artwork is unavailable", async () => {
    lookup.mockResolvedValue({ status: "success", candidate });
    getCover.mockResolvedValue({ status: "unavailable" });

    render(
      await CatalogueReleasePage({
        params: Promise.resolve({ id: externalId }),
      }),
    );

    expect(screen.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
    expect(screen.getByText(/Metadata from/)).toHaveTextContent(
      "Metadata from MusicBrainz.",
    );
    expect(
      screen.getByRole("link", { name: "Add to collection" }),
    ).toHaveAttribute("href", `/add/manual?catalogueId=${externalId}`);
    expect(
      screen.getByRole("link", { name: "Add to wishlist" }),
    ).toHaveAttribute("href", `/wishlist/add?catalogueId=${externalId}`);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("carries displayed artwork into collection and wishlist creation", async () => {
    const coverUrl = `https://coverartarchive.org/release/${externalId}/front-500`;
    const originalUrl = `https://coverartarchive.org/release/${externalId}/front`;
    lookup.mockResolvedValue({ status: "success", candidate });
    getCover.mockResolvedValue({
      status: "success",
      coverUrl,
      originalUrl,
    });

    render(
      await CatalogueReleasePage({
        params: Promise.resolve({ id: externalId }),
      }),
    );

    const expectedQuery = new URLSearchParams({
      catalogueId: externalId,
      coverUrl,
      coverOriginalUrl: originalUrl,
    }).toString();
    expect(
      screen.getByRole("link", { name: "Add to collection" }),
    ).toHaveAttribute("href", `/add/manual?${expectedQuery}`);
    expect(
      screen.getByRole("link", { name: "Add to wishlist" }),
    ).toHaveAttribute("href", `/wishlist/add?${expectedQuery}`);
  });

  it("returns to the optional edition list when review came from an album", async () => {
    const albumId = "22222222-2222-4222-8222-222222222222";
    lookup.mockResolvedValue({ status: "success", candidate });
    getCover.mockResolvedValue({ status: "no_art" });

    render(
      await CatalogueReleasePage({
        params: Promise.resolve({ id: externalId }),
        searchParams: Promise.resolve({ albumId }),
      }),
    );

    expect(
      screen.getByRole("link", { name: "← Edition results" }),
    ).toHaveAttribute("href", `/add/catalogue/${albumId}/editions`);
  });
});
