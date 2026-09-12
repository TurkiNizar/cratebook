import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  createCurrentReleaseSearchUrl,
  findExpectedRelease,
  normalizeComparable,
  REQUIRED_CATEGORIES,
  runCurrentMusicBrainzBenchmark,
  summarizeResults,
  validateFixture,
} from "./catalogue-quality-lib.mjs";

const fixtureUrl = new URL(
  "catalogue-quality/fixture.json",
  `file://${process.cwd()}/`,
);
const baselineUrl = new URL(
  "catalogue-quality/baseline-musicbrainz-release.json",
  `file://${process.cwd()}/`,
);

describe("catalogue quality fixture", () => {
  it("is valid and covers every agreed search category", async () => {
    const fixture = validateFixture(
      JSON.parse(await readFile(fixtureUrl, "utf8")),
    );
    const categories = new Set(
      fixture.cases.flatMap((testCase) => testCase.categories),
    );

    expect(fixture.cases).toHaveLength(14);
    expect(categories).toEqual(new Set(REQUIRED_CATEGORIES));
    for (const category of REQUIRED_CATEGORIES) {
      expect(
        fixture.cases.filter((testCase) =>
          testCase.categories.includes(category),
        ).length,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("records a transport-clean baseline for every fixture case", async () => {
    const fixture = validateFixture(
      JSON.parse(await readFile(fixtureUrl, "utf8")),
    );
    const baseline = JSON.parse(await readFile(baselineUrl, "utf8"));

    expect(baseline.fixtureVersion).toBe(fixture.version);
    expect(
      baseline.results.map(({ id, categories, query }) => ({
        id,
        categories,
        query,
      })),
    ).toEqual(
      fixture.cases.map(({ id, categories, query }) => ({
        id,
        categories,
        query,
      })),
    );
    expect(
      baseline.results.every((result) =>
        ["recalled", "missed"].includes(result.status),
      ),
    ).toBe(true);
    expect(baseline.summary).toEqual(summarizeResults(baseline.results));
    expect(baseline.summary).toMatchObject({
      total: 14,
      recalled: 4,
      recallPercent: 28.6,
    });
  });

  it("normalizes punctuation and diacritics without weakening exact album matching", () => {
    expect(normalizeComparable("Ágætis  byrjun")).toBe("agaetis byrjun");
    expect(normalizeComparable("AC/DC")).toBe("ac dc");
    expect(
      findExpectedRelease(
        [
          {
            id: "release-id",
            title: "Ágætis byrjun",
            "artist-credit": [{ name: "Sigur Rós" }],
          },
        ],
        { artists: ["Sigur Ros"], titles: ["Agaetis byrjun", "Ágætis byrjun"] },
      ),
    ).toMatchObject({ rank: 1, artist: "Sigur Rós", title: "Ágætis byrjun" });
  });

  it("reproduces the current application query contract", () => {
    const url = createCurrentReleaseSearchUrl("AC/DC: Live");

    expect(url.pathname).toBe("/ws/2/release/");
    expect(url.searchParams.get("query")).toBe(
      "(artist:(AC\\/DC\\: Live) OR release:(AC\\/DC\\: Live) OR catno:(AC\\/DC\\: Live) OR barcode:(AC\\/DC\\: Live)) AND format:vinyl",
    );
    expect(url.searchParams.get("limit")).toBe("12");
  });

  it("records ranks, misses, and category recall deterministically", async () => {
    const fixture = {
      version: 1,
      cases: [
        {
          id: "hit",
          categories: REQUIRED_CATEGORIES,
          query: "expected",
          expected: { artists: ["Artist"], titles: ["Album"] },
        },
        {
          id: "miss",
          categories: ["common_album"],
          query: "missing",
          expected: { artists: ["Other"], titles: ["Other album"] },
        },
      ],
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            releases: [
              {
                id: "wrong",
                title: "Wrong",
                "artist-credit": [{ name: "Artist" }],
              },
              {
                id: "right",
                title: "Album",
                "artist-credit": [{ name: "Artist" }],
              },
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ releases: [] })));

    const result = await runCurrentMusicBrainzBenchmark(fixture, {
      fetchImplementation,
      pause: vi.fn(),
      now: () => new Date("2026-09-12T12:00:00.000Z"),
    });

    expect(result.summary).toMatchObject({
      total: 2,
      recalled: 1,
      recallPercent: 50,
    });
    expect(result.summary.byCategory.common_album).toEqual({
      total: 2,
      recalled: 1,
      recallPercent: 50,
    });
    expect(result.results).toEqual([
      expect.objectContaining({
        status: "recalled",
        match: expect.objectContaining({ rank: 2 }),
      }),
      expect.objectContaining({ status: "missed", match: null }),
    ]);
  });

  it("retries temporary MusicBrainz failures until a result is measurable", async () => {
    const fixture = {
      version: 1,
      cases: [
        {
          id: "retry",
          categories: REQUIRED_CATEGORIES,
          query: "Album",
          expected: { artists: ["Artist"], titles: ["Album"] },
        },
      ],
    };
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            releases: [
              {
                id: "release-id",
                title: "Album",
                "artist-credit": [{ name: "Artist" }],
              },
            ],
          }),
        ),
      );
    const pause = vi.fn();

    const result = await runCurrentMusicBrainzBenchmark(fixture, {
      fetchImplementation,
      pause,
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledTimes(2);
    expect(result.results[0].status).toBe("recalled");
  });
});
