import {
  normalizeComparable,
  summarizeResults,
  validateFixture,
} from "./catalogue-quality-lib.mjs";

const MUSICBRAINZ_RELEASE_GROUP_API =
  "https://musicbrainz.org/ws/2/release-group/";
const MUSICBRAINZ_RELEASE_API = "https://musicbrainz.org/ws/2/release/";
const MUSICBRAINZ_RELEASE_GROUP_URL = "https://musicbrainz.org/release-group/";
const ITUNES_SEARCH_API = "https://itunes.apple.com/search";
const USER_AGENT = "Cratebook/0.1.0 (https://cratebook.vercel.app)";

function escapeLucene(value) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
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

function isIdentifierCase(testCase, category) {
  return testCase.categories.includes(category);
}

export function createMusicBrainzAlbumSearchUrl(testCase, limit = 12) {
  const url = new URL(
    isIdentifierCase(testCase, "barcode") ||
      isIdentifierCase(testCase, "catalogue_number")
      ? MUSICBRAINZ_RELEASE_API
      : MUSICBRAINZ_RELEASE_GROUP_API,
  );
  const query = testCase.query.trim().replace(/\s+/g, " ");

  if (isIdentifierCase(testCase, "barcode")) {
    url.searchParams.set("query", `barcode:${escapeLucene(query)}`);
  } else if (isIdentifierCase(testCase, "catalogue_number")) {
    url.searchParams.set("query", `catno:"${escapeLucene(query)}"`);
  } else {
    const clauses = query
      .split(" ")
      .map(
        (token) =>
          `(artist:(${escapeLucene(token)}) OR releasegroup:(${escapeLucene(token)}))`,
      );
    url.searchParams.set(
      "query",
      `${clauses.join(" AND ")} AND primarytype:album`,
    );
  }

  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(limit));
  return url;
}

export function createItunesAlbumSearchUrl(testCase, limit = 12) {
  const url = new URL(ITUNES_SEARCH_API);
  url.searchParams.set("term", testCase.query.trim().replace(/\s+/g, " "));
  url.searchParams.set("country", "US");
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "album");
  url.searchParams.set("limit", String(limit));
  return url;
}

function musicBrainzCandidates(payload) {
  if (payload && Array.isArray(payload["release-groups"])) {
    return payload["release-groups"].map((group) => ({
      externalId: typeof group.id === "string" ? group.id : null,
      sourceUrl:
        typeof group.id === "string"
          ? `${MUSICBRAINZ_RELEASE_GROUP_URL}${group.id}`
          : null,
      artist: artistCredit(group["artist-credit"]),
      title: typeof group.title === "string" ? group.title : "",
      artworkUrl:
        typeof group.id === "string"
          ? `https://coverartarchive.org/release-group/${group.id}/front-500`
          : null,
    }));
  }

  if (payload && Array.isArray(payload.releases)) {
    const candidates = [];
    const seen = new Set();
    for (const release of payload.releases) {
      const group = release?.["release-group"];
      if (!group || typeof group.id !== "string" || seen.has(group.id)) {
        continue;
      }
      seen.add(group.id);
      candidates.push({
        externalId: group.id,
        sourceUrl: `${MUSICBRAINZ_RELEASE_GROUP_URL}${group.id}`,
        artist: artistCredit(release["artist-credit"]),
        title: typeof group.title === "string" ? group.title : "",
        artworkUrl: `https://coverartarchive.org/release-group/${group.id}/front-500`,
      });
    }
    return candidates;
  }

  return null;
}

function itunesCandidates(payload) {
  if (!payload || !Array.isArray(payload.results)) return null;
  return payload.results.map((album) => ({
    externalId:
      typeof album.collectionId === "number"
        ? String(album.collectionId)
        : null,
    sourceUrl:
      typeof album.collectionViewUrl === "string"
        ? album.collectionViewUrl
        : null,
    artist: typeof album.artistName === "string" ? album.artistName : "",
    title: typeof album.collectionName === "string" ? album.collectionName : "",
    artworkUrl:
      typeof album.artworkUrl100 === "string" ? album.artworkUrl100 : null,
  }));
}

function findExpectedCandidate(candidates, expected) {
  const index = candidates.findIndex(
    (candidate) =>
      expected.artists.some(
        (artist) =>
          normalizeComparable(candidate.artist) === normalizeComparable(artist),
      ) &&
      expected.titles.some(
        (title) =>
          normalizeComparable(candidate.title) === normalizeComparable(title),
      ),
  );
  if (index < 0) return null;
  return { rank: index + 1, ...candidates[index] };
}

function summarizeArtwork(results) {
  const counts = {
    available: 0,
    missing: 0,
    unavailable: 0,
    notChecked: 0,
    notRecalled: 0,
  };
  for (const result of results) {
    if (result.status !== "recalled") counts.notRecalled += 1;
    else if (result.artworkStatus === "available") counts.available += 1;
    else if (result.artworkStatus === "missing") counts.missing += 1;
    else if (result.artworkStatus === "unavailable") counts.unavailable += 1;
    else counts.notChecked += 1;
  }
  return counts;
}

async function checkMusicBrainzArtwork(match, fetchImplementation, pause) {
  for (let attempt = 0; attempt <= 2; attempt += 1) {
    try {
      const response = await fetchImplementation(match.artworkUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      });
      if ((response.status === 429 || response.status === 503) && attempt < 2) {
        await pause(1000);
        continue;
      }
      if (response.status === 404) return "missing";
      return response.ok || response.status === 307
        ? "available"
        : "unavailable";
    } catch {
      return "unavailable";
    }
  }
  return "unavailable";
}

const providers = {
  musicbrainz_release_group: {
    provider: "MusicBrainz release-group search",
    strategy:
      "Token-wise artist/title album search with exact release lookup for barcodes and catalogue numbers",
    intervalMs: 2000,
    retries: 5,
    createUrl: createMusicBrainzAlbumSearchUrl,
    parseCandidates: musicBrainzCandidates,
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  },
  itunes_album: {
    provider: "Apple iTunes Search API",
    strategy: "US-store music album search",
    intervalMs: 3200,
    retries: 2,
    createUrl: createItunesAlbumSearchUrl,
    parseCandidates: itunesCandidates,
    headers: { Accept: "application/json" },
  },
};

export async function runProviderBenchmark(
  fixture,
  providerId,
  {
    fetchImplementation = fetch,
    pause = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now = () => new Date(),
    caseIds = null,
    probeArtwork = false,
  } = {},
) {
  validateFixture(fixture);
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown benchmark provider: ${providerId}`);
  const cases = caseIds
    ? fixture.cases.filter((testCase) => caseIds.includes(testCase.id))
    : fixture.cases;
  if (cases.length === 0) {
    throw new Error("No fixture cases matched the requested case ids.");
  }

  const results = [];
  for (let index = 0; index < cases.length; index += 1) {
    const testCase = cases[index];
    if (index > 0) await pause(provider.intervalMs);

    let response;
    let requestError;
    for (let attempt = 0; attempt <= provider.retries; attempt += 1) {
      try {
        response = await fetchImplementation(provider.createUrl(testCase), {
          headers: provider.headers,
          signal: AbortSignal.timeout(10_000),
        });
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < provider.retries
        ) {
          await pause(provider.intervalMs);
          continue;
        }
        break;
      } catch (error) {
        requestError = error;
        break;
      }
    }

    if (!response || !response.ok) {
      results.push({
        id: testCase.id,
        categories: testCase.categories,
        query: testCase.query,
        status: "request_failed",
        detail: response
          ? `HTTP ${response.status}`
          : requestError instanceof Error
            ? requestError.message
            : "Unknown request failure",
      });
      continue;
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const candidates = provider.parseCandidates(payload);
    if (!candidates) {
      results.push({
        id: testCase.id,
        categories: testCase.categories,
        query: testCase.query,
        status: "malformed_response",
      });
      continue;
    }

    const match = findExpectedCandidate(candidates, testCase.expected);
    let artworkStatus = "not_checked";
    if (match && providerId === "itunes_album") {
      artworkStatus = match.artworkUrl ? "available" : "missing";
    } else if (match && probeArtwork) {
      artworkStatus = await checkMusicBrainzArtwork(
        match,
        fetchImplementation,
        pause,
      );
    }
    results.push({
      id: testCase.id,
      categories: testCase.categories,
      query: testCase.query,
      status: match ? "recalled" : "missed",
      returned: candidates.length,
      match,
      artworkStatus,
    });
  }

  return {
    schemaVersion: 1,
    fixtureVersion: fixture.version,
    measuredAt: now().toISOString(),
    provider: provider.provider,
    strategy: provider.strategy,
    resultLimit: 12,
    summary: summarizeResults(results),
    artworkSummary: summarizeArtwork(results),
    results,
  };
}
