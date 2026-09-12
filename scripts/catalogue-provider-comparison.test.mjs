import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { REQUIRED_CATEGORIES } from "./catalogue-quality-lib.mjs";
import {
  createItunesAlbumSearchUrl,
  createMusicBrainzAlbumSearchUrl,
  runProviderBenchmark,
} from "./catalogue-provider-comparison-lib.mjs";

const textCase = {
  id: "album",
  categories: ["common_album"],
  query: "Miles Davis Kind of Blue",
  expected: { artists: ["Miles Davis"], titles: ["Kind of Blue"] },
};
const fixtureUrl = new URL(
  "catalogue-quality/fixture.json",
  `file://${process.cwd()}/`,
);
const comparisonUrl = new URL(
  "catalogue-quality/comparison-album-sources.json",
  `file://${process.cwd()}/`,
);

describe("catalogue provider comparison", () => {
  it("records complete transport-clean results for both evaluated providers", async () => {
    const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));
    const comparison = JSON.parse(await readFile(comparisonUrl, "utf8"));
    const expectedIds = fixture.cases.map((testCase) => testCase.id);

    expect(comparison.fixtureVersion).toBe(fixture.version);
    expect(comparison.results.map((result) => result.id)).toEqual([
      "musicbrainz_release_group",
      "itunes_album",
    ]);
    for (const result of comparison.results) {
      expect(result.results.map((entry) => entry.id)).toEqual(expectedIds);
      expect(
        result.results.every((entry) =>
          ["recalled", "missed"].includes(entry.status),
        ),
      ).toBe(true);
    }

    expect(comparison.results[0]).toMatchObject({
      summary: { total: 14, recalled: 14, recallPercent: 100 },
      artworkSummary: { available: 14, missing: 0, unavailable: 0 },
    });
    expect(comparison.results[1]).toMatchObject({
      summary: { total: 14, recalled: 9, recallPercent: 64.3 },
      artworkSummary: { available: 9, missing: 0, unavailable: 0 },
    });
  });

  it("builds token-wise MusicBrainz release-group queries", () => {
    const url = createMusicBrainzAlbumSearchUrl(textCase);
    const query = url.searchParams.get("query");

    expect(url.pathname).toBe("/ws/2/release-group/");
    expect(query).toContain(
      "(artist:(Miles) OR releasegroup:(Miles)) AND (artist:(Davis) OR releasegroup:(Davis))",
    );
    expect(query).toContain("primarytype:album");
    expect(url.searchParams.get("limit")).toBe("12");
  });

  it("routes MusicBrainz identifiers through exact release fields", () => {
    const barcodeUrl = createMusicBrainzAlbumSearchUrl({
      ...textCase,
      categories: ["barcode"],
      query: "888837168618",
    });
    const catalogueUrl = createMusicBrainzAlbumSearchUrl({
      ...textCase,
      categories: ["catalogue_number"],
      query: "CS 8163",
    });

    expect(barcodeUrl.pathname).toBe("/ws/2/release/");
    expect(barcodeUrl.searchParams.get("query")).toBe("barcode:888837168618");
    expect(catalogueUrl.searchParams.get("query")).toBe('catno:"CS 8163"');
  });

  it("builds an unauthenticated US-store iTunes album query", () => {
    const url = createItunesAlbumSearchUrl(textCase);

    expect(url.origin + url.pathname).toBe("https://itunes.apple.com/search");
    expect(url.searchParams.get("term")).toBe(textCase.query);
    expect(url.searchParams.get("country")).toBe("US");
    expect(url.searchParams.get("media")).toBe("music");
    expect(url.searchParams.get("entity")).toBe("album");
    expect(url.searchParams.get("limit")).toBe("12");
  });

  it("scores MusicBrainz release groups and exposes representative artwork", async () => {
    const fixture = {
      version: 1,
      cases: [{ ...textCase, categories: REQUIRED_CATEGORIES }],
    };
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          "release-groups": [
            {
              id: "group-id",
              title: "Kind of Blue",
              "artist-credit": [{ name: "Miles Davis" }],
            },
          ],
        }),
      ),
    );

    const result = await runProviderBenchmark(
      fixture,
      "musicbrainz_release_group",
      { fetchImplementation },
    );

    expect(result.summary.recalled).toBe(1);
    expect(result.artworkSummary.notChecked).toBe(1);
    expect(result.results[0].match).toMatchObject({
      rank: 1,
      externalId: "group-id",
      artworkUrl:
        "https://coverartarchive.org/release-group/group-id/front-500",
    });
    expect(fetchImplementation.mock.calls[0][1]).toMatchObject({
      headers: {
        Accept: "application/json",
        "User-Agent": "Cratebook/0.1.0 (https://cratebook.vercel.app)",
      },
    });
  });

  it("scores iTunes album results without requiring credentials", async () => {
    const fixture = {
      version: 1,
      cases: [{ ...textCase, categories: REQUIRED_CATEGORIES }],
    };
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          resultCount: 1,
          results: [
            {
              collectionId: 268443092,
              collectionName: "Kind of Blue",
              artistName: "Miles Davis",
              collectionViewUrl: "https://music.apple.com/us/album/268443092",
              artworkUrl100: "https://example.apple.com/cover.jpg",
            },
          ],
        }),
      ),
    );

    const result = await runProviderBenchmark(fixture, "itunes_album", {
      fetchImplementation,
    });

    expect(result.summary.recalled).toBe(1);
    expect(result.artworkSummary).toMatchObject({
      available: 1,
      missing: 0,
    });
    expect(result.results[0].match).toMatchObject({
      externalId: "268443092",
      sourceUrl: "https://music.apple.com/us/album/268443092",
      artworkUrl: "https://example.apple.com/cover.jpg",
    });
    expect(fetchImplementation.mock.calls[0][1].headers).toEqual({
      Accept: "application/json",
    });
  });

  it("can rerun selected cases without weakening full-fixture validation", async () => {
    const fixture = {
      version: 1,
      cases: [
        { ...textCase, id: "selected", categories: REQUIRED_CATEGORIES },
        { ...textCase, id: "skipped", query: "Other album" },
      ],
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ resultCount: 0, results: [] })),
      );

    const result = await runProviderBenchmark(fixture, "itunes_album", {
      fetchImplementation,
      caseIds: ["selected"],
    });

    expect(result.results.map((entry) => entry.id)).toEqual(["selected"]);
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("can verify MusicBrainz representative artwork without downloading it", async () => {
    const fixture = {
      version: 1,
      cases: [{ ...textCase, categories: REQUIRED_CATEGORIES }],
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            releases: [
              {
                title: "Kind of Blue",
                "artist-credit": [{ name: "Miles Davis" }],
                "release-group": { id: "group-id", title: "Kind of Blue" },
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 307 }));

    const result = await runProviderBenchmark(
      fixture,
      "musicbrainz_release_group",
      { fetchImplementation, probeArtwork: true },
    );

    expect(fetchImplementation.mock.calls[1][0]).toBe(
      "https://coverartarchive.org/release-group/group-id/front-500",
    );
    expect(fetchImplementation.mock.calls[1][1]).toMatchObject({
      method: "HEAD",
      redirect: "manual",
      headers: {
        "User-Agent": "Cratebook/0.1.0 (https://cratebook.vercel.app)",
      },
    });
    expect(result.results[0].artworkStatus).toBe("available");
    expect(result.artworkSummary.available).toBe(1);
  });
});
