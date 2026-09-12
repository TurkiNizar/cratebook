import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogueAlbumCandidate } from "@/lib/catalogue/types";

import { CatalogueSearchResults } from "./catalogue-search-results";

const candidate: CatalogueAlbumCandidate = {
  source: "musicbrainz",
  entityType: "release_group",
  externalId: "11111111-1111-4111-8111-111111111111",
  sourceUrl:
    "https://musicbrainz.org/release-group/11111111-1111-4111-8111-111111111111",
  artist: "Miles Davis",
  title: "Kind of Blue",
  originalYear: 1959,
  representativeCoverUrl:
    "https://coverartarchive.org/release-group/11111111-1111-4111-8111-111111111111/front-500",
  sourceData: { provider: "musicbrainz" },
};

describe("CatalogueSearchResults", () => {
  it("shows a cover-first album with both add destinations and attribution", () => {
    render(
      <CatalogueSearchResults
        query="Miles Davis"
        result={{
          status: "success",
          candidates: [candidate],
          pagination: {
            page: 1,
            pageSize: 12,
            totalResults: 1,
            hasNextPage: false,
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 album" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
    expect(screen.getByText("Miles Davis")).toBeVisible();
    expect(screen.getByAltText("Kind of Blue cover")).toHaveAttribute(
      "src",
      candidate.representativeCoverUrl,
    );
    expect(screen.getByText("First released 1959")).toBeVisible();
    expect(
      screen.getByText("Album match · pressing not selected"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Add to collection" }),
    ).toHaveAttribute(
      "href",
      "/add/manual?catalogueAlbumId=" + candidate.externalId,
    );
    expect(
      screen.getByRole("link", { name: "Add to wishlist" }),
    ).toHaveAttribute(
      "href",
      "/wishlist/add?catalogueAlbumId=" + candidate.externalId,
    );
    expect(
      screen.getByRole("link", { name: /View album source/ }),
    ).toHaveAttribute("href", candidate.sourceUrl);
  });

  it("renders one card per album and exposes result pagination", () => {
    const secondCandidate: CatalogueAlbumCandidate = {
      ...candidate,
      externalId: "44444444-4444-4444-8444-444444444444",
      sourceUrl:
        "https://musicbrainz.org/release-group/44444444-4444-4444-8444-444444444444",
      title: "In a Silent Way",
      originalYear: null,
      representativeCoverUrl:
        "https://coverartarchive.org/release-group/44444444-4444-4444-8444-444444444444/front-500",
    };

    render(
      <CatalogueSearchResults
        query="Kind of Blue"
        result={{
          status: "success",
          candidates: [candidate, secondCandidate],
          pagination: {
            page: 2,
            pageSize: 2,
            totalResults: 5,
            hasNextPage: true,
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "5 albums" })).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "In a Silent Way" }),
    ).toBeVisible();
    expect(screen.getByText("Original year unknown")).toBeVisible();
    expect(screen.getByText("Page 2")).toBeVisible();
    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/add/catalogue?q=Kind+of+Blue",
    );
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/add/catalogue?q=Kind+of+Blue&page=3",
    );
  });

  it.each([
    [{ status: "no_results" } as const, "Nothing found for “Blue Train”"],
    [
      {
        status: "invalid_query" as const,
        message: "Enter between 2 and 200 characters.",
      },
      "Enter a little more detail",
    ],
    [
      {
        status: "rate_limited" as const,
        retryAfterSeconds: 3,
      },
      "MusicBrainz needs a moment",
    ],
    [{ status: "unavailable" } as const, "Search could not finish"],
    [{ status: "malformed_response" } as const, "Search could not finish"],
  ])("keeps manual paths available for %o", (result, heading) => {
    render(<CatalogueSearchResults query="Blue Train" result={result} />);

    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getByRole("link", { name: "Add manually" })).toHaveAttribute(
      "href",
      "/add/manual",
    );
    expect(
      screen.getByRole("link", { name: "Add to wishlist manually" }),
    ).toHaveAttribute("href", "/wishlist/add");
  });
});
