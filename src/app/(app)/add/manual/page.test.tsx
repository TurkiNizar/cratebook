import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CatalogueReleaseCandidate } from "@/lib/catalogue/types";

const { getCover, lookup } = vi.hoisted(() => ({
  getCover: vi.fn(),
  lookup: vi.fn(),
}));

vi.mock("@/lib/catalogue/musicbrainz", () => ({
  musicBrainzCatalogueProvider: { getCover, lookup },
}));
vi.mock("./actions", () => ({
  createManualRecord: vi.fn(),
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
});
