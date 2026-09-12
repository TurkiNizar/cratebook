import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CatalogueReleaseCandidate } from "@/lib/catalogue/types";

import { CatalogueSearchResults } from "./catalogue-search-results";

const candidate: CatalogueReleaseCandidate = {
  source: "musicbrainz",
  entityType: "release",
  externalId: "11111111-1111-4111-8111-111111111111",
  sourceUrl:
    "https://musicbrainz.org/release/11111111-1111-4111-8111-111111111111",
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

describe("CatalogueSearchResults", () => {
  it("shows enough edition context and source attribution to select a release", () => {
    render(
      <CatalogueSearchResults
        query="Miles Davis"
        result={{ status: "success", candidates: [candidate] }}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 result" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Kind of Blue" })).toBeVisible();
    expect(screen.getByText("Miles Davis")).toBeVisible();
    expect(screen.getByText("Columbia")).toBeVisible();
    expect(screen.getByText("CS 8163")).toBeVisible();
    expect(screen.getByText("Stereo edition")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review release" }),
    ).toHaveAttribute("href", "/add/catalogue/" + candidate.externalId);
    expect(screen.getByRole("link", { name: /View source/ })).toHaveAttribute(
      "href",
      candidate.sourceUrl,
    );
  });

  it("keeps ambiguous editions distinct with their pressing clues", () => {
    const secondCandidate: CatalogueReleaseCandidate = {
      ...candidate,
      externalId: "44444444-4444-4444-8444-444444444444",
      sourceUrl:
        "https://musicbrainz.org/release/44444444-4444-4444-8444-444444444444",
      releaseYear: 2013,
      country: "EU",
      label: "Music On Vinyl",
      catalogNumber: "MOVLP 019",
      editionDescription: "180 gram blue vinyl reissue",
    };

    render(
      <CatalogueSearchResults
        query="Kind of Blue"
        result={{
          status: "success",
          candidates: [candidate, secondCandidate],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "2 results" })).toBeVisible();
    expect(
      screen.getAllByRole("heading", { name: "Kind of Blue" }),
    ).toHaveLength(2);
    expect(screen.getByText("CS 8163")).toBeVisible();
    expect(screen.getByText("MOVLP 019")).toBeVisible();
    expect(screen.getByText("Stereo edition")).toBeVisible();
    expect(screen.getByText("180 gram blue vinyl reissue")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Review release" }),
    ).toHaveLength(2);
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
