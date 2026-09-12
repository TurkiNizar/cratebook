const MUSICBRAINZ_RELEASE_API = "https://musicbrainz.org/ws/2/release/";
const MUSICBRAINZ_RELEASE_URL = "https://musicbrainz.org/release/";
const USER_AGENT = "Cratebook/0.1.0 (https://cratebook.vercel.app)";

export const REQUIRED_CATEGORIES = [
  "famous_artist",
  "common_album",
  "less_common_album",
  "punctuation_diacritics",
  "partial_title",
  "barcode",
  "catalogue_number",
];

function escapeLucene(value) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

export function createCurrentReleaseSearchUrl(query, limit = 12) {
  const escaped = escapeLucene(query.trim().replace(/\s+/g, " "));
  const url = new URL(MUSICBRAINZ_RELEASE_API);
  url.searchParams.set(
    "query",
    `(artist:(${escaped}) OR release:(${escaped}) OR catno:(${escaped}) OR barcode:(${escaped})) AND format:vinyl`,
  );
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));
  return url;
}

export function normalizeComparable(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ø/g, "o")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function artistCredit(value) {
  if (!Array.isArray(value)) return "";
  return value
    .map((credit) =>
      credit && typeof credit.name === "string"
        ? credit.name +
          (typeof credit.joinphrase === "string" ? credit.joinphrase : "")
        : "",
    )
    .join("");
}

function matchesAlias(value, aliases) {
  const normalized = normalizeComparable(value);
  return aliases.some((alias) => normalized === normalizeComparable(alias));
}

export function findExpectedRelease(releases, expected) {
  const index = releases.findIndex(
    (release) =>
      release &&
      typeof release.title === "string" &&
      matchesAlias(release.title, expected.titles) &&
      matchesAlias(artistCredit(release["artist-credit"]), expected.artists),
  );
  if (index < 0) return null;

  const release = releases[index];
  return {
    rank: index + 1,
    externalId: typeof release.id === "string" ? release.id : null,
    sourceUrl:
      typeof release.id === "string"
        ? `${MUSICBRAINZ_RELEASE_URL}${release.id}`
        : null,
    artist: artistCredit(release["artist-credit"]),
    title: release.title,
  };
}

export function validateFixture(fixture) {
  if (!fixture || fixture.version !== 1 || !Array.isArray(fixture.cases)) {
    throw new Error("Fixture must use version 1 and contain a cases array.");
  }
  if (fixture.cases.length === 0) {
    throw new Error("Fixture must contain at least one case.");
  }

  const ids = new Set();
  const categories = new Set();
  for (const testCase of fixture.cases) {
    if (
      !testCase ||
      typeof testCase.id !== "string" ||
      typeof testCase.query !== "string" ||
      !Array.isArray(testCase.categories) ||
      !testCase.expected ||
      !Array.isArray(testCase.expected.artists) ||
      !Array.isArray(testCase.expected.titles) ||
      testCase.expected.artists.length === 0 ||
      testCase.expected.titles.length === 0
    ) {
      throw new Error(
        "Every fixture case needs an id, query, categories, and expected aliases.",
      );
    }
    if (ids.has(testCase.id)) {
      throw new Error(`Duplicate fixture case id: ${testCase.id}`);
    }
    ids.add(testCase.id);
    testCase.categories.forEach((category) => categories.add(category));
  }

  const missing = REQUIRED_CATEGORIES.filter(
    (category) => !categories.has(category),
  );
  if (missing.length > 0) {
    throw new Error(
      `Fixture is missing required categories: ${missing.join(", ")}`,
    );
  }
  return fixture;
}

export function summarizeResults(results) {
  const categoryCounts = new Map();
  for (const result of results) {
    for (const category of result.categories) {
      const counts = categoryCounts.get(category) ?? { total: 0, recalled: 0 };
      counts.total += 1;
      if (result.status === "recalled") counts.recalled += 1;
      categoryCounts.set(category, counts);
    }
  }

  const recalled = results.filter(
    (result) => result.status === "recalled",
  ).length;
  return {
    total: results.length,
    recalled,
    recallPercent: Number(((recalled / results.length) * 100).toFixed(1)),
    byCategory: Object.fromEntries(
      [...categoryCounts.entries()].map(([category, counts]) => [
        category,
        {
          ...counts,
          recallPercent: Number(
            ((counts.recalled / counts.total) * 100).toFixed(1),
          ),
        },
      ]),
    ),
  };
}

export async function runCurrentMusicBrainzBenchmark(
  fixture,
  {
    fetchImplementation = fetch,
    pause = () => new Promise((resolve) => setTimeout(resolve, 2000)),
    now = () => new Date(),
  } = {},
) {
  validateFixture(fixture);
  const results = [];

  for (let index = 0; index < fixture.cases.length; index += 1) {
    const testCase = fixture.cases[index];
    if (index > 0) await pause();

    let response;
    let requestError;
    for (let attempt = 0; attempt <= 5; attempt += 1) {
      try {
        response = await fetchImplementation(
          createCurrentReleaseSearchUrl(testCase.query),
          {
            headers: { Accept: "application/json", "User-Agent": USER_AGENT },
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < 5
        ) {
          await pause();
          continue;
        }
        break;
      } catch (error) {
        requestError = error;
        break;
      }
    }

    if (!response) {
      results.push({
        id: testCase.id,
        categories: testCase.categories,
        query: testCase.query,
        status: "request_failed",
        detail:
          requestError instanceof Error
            ? requestError.message
            : "Unknown request failure",
      });
      continue;
    }

    if (!response.ok) {
      results.push({
        id: testCase.id,
        categories: testCase.categories,
        query: testCase.query,
        status: "request_failed",
        detail: `HTTP ${response.status}`,
      });
      continue;
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!payload || !Array.isArray(payload.releases)) {
      results.push({
        id: testCase.id,
        categories: testCase.categories,
        query: testCase.query,
        status: "malformed_response",
      });
      continue;
    }

    const match = findExpectedRelease(payload.releases, testCase.expected);
    results.push({
      id: testCase.id,
      categories: testCase.categories,
      query: testCase.query,
      status: match ? "recalled" : "missed",
      returned: payload.releases.length,
      match,
    });
  }

  return {
    schemaVersion: 1,
    fixtureVersion: fixture.version,
    measuredAt: now().toISOString(),
    provider: "MusicBrainz release search",
    strategy: "Current Cratebook exact-release query with vinyl filter",
    resultLimit: 12,
    summary: summarizeResults(results),
    results,
  };
}
