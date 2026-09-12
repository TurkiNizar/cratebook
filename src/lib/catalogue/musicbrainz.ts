import "server-only";

import type { Enums, Json } from "@/types/database";

import type {
  CatalogueAlbumCandidate,
  CatalogueAlbumLookupResult,
  CatalogueAlbumProvider,
  CatalogueAlbumSearchOptions,
  CatalogueAlbumSearchResult,
  CatalogueCoverResult,
  CatalogueLookupResult,
  CatalogueProvider,
  CatalogueReleaseCandidate,
  CatalogueSearchResult,
} from "./types";
import { getCoverArtUrlForEntity } from "./provenance";

const MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2/release/";
const MUSICBRAINZ_RELEASE_GROUP_API_URL =
  "https://musicbrainz.org/ws/2/release-group/";
const MUSICBRAINZ_RELEASE_URL = "https://musicbrainz.org/release/";
const MUSICBRAINZ_RELEASE_GROUP_URL = "https://musicbrainz.org/release-group/";
const COVER_ART_API_URL = "https://coverartarchive.org/release/";
const COVER_ART_RELEASE_GROUP_API_URL =
  "https://coverartarchive.org/release-group/";
const MUSICBRAINZ_USER_AGENT = "Cratebook/0.1.0 (https://cratebook.vercel.app)";
const SEARCH_CACHE_SECONDS = 24 * 60 * 60;
const COVER_CACHE_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_SEARCH_LIMIT = 12;
const MAX_ALBUM_PAGE_SIZE = 24;
const IDENTIFIER_SEARCH_LIMIT = 100;
const DEFAULT_TIMEOUT_MS = 6_000;
const DEFAULT_MINIMUM_INTERVAL_MS = 1_000;
const DEFAULT_RETRIES = 1;
const MAX_RETRY_DELAY_MS = 5_000;
const MUSICBRAINZ_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Fetch = typeof fetch;

type MusicBrainzProviderOptions = {
  fetch?: Fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  minimumIntervalMs?: number;
  timeoutMs?: number;
  retries?: number;
};

type UpstreamResult =
  | {
      status: "response";
      statusCode: number;
      ok: boolean;
      retryAfterSeconds: number | null;
      body: string | null;
    }
  | { status: "unavailable" };

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, maximum = Number.POSITIVE_INFINITY) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized && normalized.length <= maximum ? normalized : null;
}

function integerYear(value: unknown) {
  const match = typeof value === "string" ? value.match(/^(\d{4})/) : null;
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  return year >= 1000 && year <= 9999 ? year : null;
}

function positiveInteger(value: unknown, maximum: number) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= maximum
    ? value
    : null;
}

function escapeLucene(value: string) {
  return value.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

function createSearchUrl(query: string) {
  const escaped = escapeLucene(query);
  const url = new URL(MUSICBRAINZ_API_URL);
  url.searchParams.set(
    "query",
    `(artist:(${escaped}) OR release:(${escaped}) OR catno:(${escaped}) OR barcode:(${escaped})) AND format:vinyl`,
  );
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(DEFAULT_SEARCH_LIMIT));
  return url.toString();
}

function createLookupUrl(externalId: string) {
  const url = new URL(`${MUSICBRAINZ_API_URL}${externalId}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", "artists+labels+release-groups");
  return url.toString();
}

type AlbumSearchMode = "text" | "barcode" | "catalog_number";

function albumSearchMode(query: string): AlbumSearchMode {
  const compact = query.replace(/[\s-]/g, "");
  if (/^\d{8,14}$/.test(compact)) {
    return "barcode";
  }
  if (
    query.length <= 40 &&
    /\p{L}/u.test(query) &&
    /\d/.test(query) &&
    query.split(" ").length <= 3
  ) {
    return "catalog_number";
  }
  return "text";
}

function createAlbumSearchUrl(query: string, page: number, pageSize: number) {
  const mode = albumSearchMode(query);
  const url = new URL(
    mode === "text" ? MUSICBRAINZ_RELEASE_GROUP_API_URL : MUSICBRAINZ_API_URL,
  );

  if (mode === "barcode") {
    url.searchParams.set(
      "query",
      `barcode:${escapeLucene(query.replace(/[\s-]/g, ""))}`,
    );
  } else if (mode === "catalog_number") {
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
  url.searchParams.set(
    "limit",
    String(mode === "text" ? pageSize : IDENTIFIER_SEARCH_LIMIT),
  );
  url.searchParams.set(
    "offset",
    String(mode === "text" ? (page - 1) * pageSize : 0),
  );
  return { mode, url: url.toString() };
}

function createAlbumLookupUrl(externalId: string) {
  const url = new URL(`${MUSICBRAINZ_RELEASE_GROUP_API_URL}${externalId}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("inc", "artists");
  return url.toString();
}

function artistCredit(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  let result = "";
  for (const credit of value) {
    if (!isRecord(credit)) {
      return null;
    }
    const name = stringValue(credit.name, 300);
    const joinPhrase =
      typeof credit.joinphrase === "string" ? credit.joinphrase : "";
    if (!name) {
      return null;
    }
    result += `${name}${joinPhrase}`;
  }

  return result.length <= 300 ? result : null;
}

function releaseGroup(value: unknown) {
  return isRecord(value) ? value : null;
}

function releaseMedia(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function releaseFormat(
  media: JsonRecord[],
  primaryType: string | null,
  packaging: string | null,
): Enums<"release_format"> | null {
  if (packaging?.toLocaleLowerCase("en").includes("box")) {
    return "box_set";
  }

  const formats = media
    .map((medium) => stringValue(medium.format)?.toLocaleLowerCase("en"))
    .filter((format): format is string => Boolean(format));
  if (formats.some((format) => format.includes('7" vinyl'))) {
    return "seven_inch";
  }
  if (formats.some((format) => format.includes('10" vinyl'))) {
    return "ten_inch";
  }
  if (formats.some((format) => format.includes('12" vinyl'))) {
    return primaryType?.toLocaleLowerCase("en") === "album"
      ? "lp"
      : "twelve_inch";
  }
  if (formats.some((format) => format.includes("vinyl"))) {
    return primaryType?.toLocaleLowerCase("en") === "album" ? "lp" : "other";
  }
  return null;
}

function firstLabel(value: unknown) {
  if (!Array.isArray(value)) {
    return { label: null, catalogNumber: null };
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const labelRecord = isRecord(entry.label) ? entry.label : null;
    const label = stringValue(labelRecord?.name, 300);
    const catalogNumber = stringValue(entry["catalog-number"], 100);
    if (label || catalogNumber) {
      return { label, catalogNumber };
    }
  }

  return { label: null, catalogNumber: null };
}

function normalizedSourceData(
  release: JsonRecord,
  artist: string,
  title: string,
  media: JsonRecord[],
): Json {
  const group = releaseGroup(release["release-group"]);
  const labelInfo = Array.isArray(release["label-info"])
    ? release["label-info"].filter(isRecord).slice(0, 10)
    : [];

  return {
    provider: "musicbrainz",
    entityType: "release",
    release: {
      id: release.id as string,
      title,
      artist,
      date: stringValue(release.date, 32),
      country: stringValue(release.country, 16),
      status: stringValue(release.status, 64),
      packaging: stringValue(release.packaging, 100),
      barcode: stringValue(release.barcode, 100),
      disambiguation: stringValue(release.disambiguation, 1000),
      releaseGroup: group
        ? {
            id: stringValue(group.id, 64),
            primaryType: stringValue(group["primary-type"], 100),
            firstReleaseDate: stringValue(group["first-release-date"], 32),
          }
        : null,
      media: media.slice(0, 100).map((medium) => ({
        format: stringValue(medium.format, 100),
        position: positiveInteger(medium.position, 100),
        trackCount: positiveInteger(medium["track-count"], 999),
      })),
      labelInfo: labelInfo.map((entry) => ({
        catalogNumber: stringValue(entry["catalog-number"], 100),
        label: isRecord(entry.label)
          ? {
              id: stringValue(entry.label.id, 64),
              name: stringValue(entry.label.name, 300),
            }
          : null,
      })),
    },
  };
}

function normalizeCandidate(value: unknown): CatalogueReleaseCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const externalId = stringValue(value.id, 64);
  const title = stringValue(value.title, 300);
  const artist = artistCredit(value["artist-credit"]);
  if (
    !externalId ||
    !MUSICBRAINZ_ID_PATTERN.test(externalId) ||
    !title ||
    !artist
  ) {
    return null;
  }

  const group = releaseGroup(value["release-group"]);
  const primaryType = stringValue(group?.["primary-type"], 100);
  const media = releaseMedia(value.media);
  const packaging = stringValue(value.packaging, 100);
  const { label, catalogNumber } = firstLabel(value["label-info"]);

  return {
    source: "musicbrainz",
    entityType: "release",
    externalId,
    sourceUrl: `${MUSICBRAINZ_RELEASE_URL}${externalId}`,
    artist,
    title,
    format: releaseFormat(media, primaryType, packaging),
    discCount: media.length > 0 && media.length <= 100 ? media.length : null,
    originalYear: integerYear(group?.["first-release-date"]),
    releaseYear: integerYear(value.date),
    label,
    catalogNumber,
    country: stringValue(value.country, 100),
    editionDescription: stringValue(value.disambiguation, 1000),
    barcode: stringValue(value.barcode, 100),
    sourceData: normalizedSourceData(value, artist, title, media),
  };
}

function normalizedAlbumSourceData(
  group: JsonRecord,
  artist: string,
  title: string,
): Json {
  const secondaryTypes = Array.isArray(group["secondary-types"])
    ? group["secondary-types"]
        .map((value) => stringValue(value, 100))
        .filter((value): value is string => value !== null)
        .slice(0, 20)
    : [];

  return {
    provider: "musicbrainz",
    entityType: "release_group",
    releaseGroup: {
      id: group.id as string,
      title,
      artist,
      primaryType: stringValue(group["primary-type"], 100),
      secondaryTypes,
      firstReleaseDate: stringValue(group["first-release-date"], 32),
      disambiguation: stringValue(group.disambiguation, 1000),
    },
  };
}

function normalizeAlbumCandidate(
  value: unknown,
  fallbackArtist: string | null = null,
): CatalogueAlbumCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const externalId = stringValue(value.id, 64);
  const title = stringValue(value.title, 300);
  const artist = artistCredit(value["artist-credit"]) ?? fallbackArtist;
  if (
    !externalId ||
    !MUSICBRAINZ_ID_PATTERN.test(externalId) ||
    !title ||
    !artist
  ) {
    return null;
  }

  return {
    source: "musicbrainz",
    entityType: "release_group",
    externalId,
    sourceUrl: `${MUSICBRAINZ_RELEASE_GROUP_URL}${externalId}`,
    artist,
    title,
    originalYear: integerYear(value["first-release-date"]),
    representativeCoverUrl: `${COVER_ART_RELEASE_GROUP_API_URL}${externalId}/front-500`,
    sourceData: normalizedAlbumSourceData(value, artist, title),
  };
}

function uniqueAlbums(candidates: Array<CatalogueAlbumCandidate | null>) {
  const seen = new Set<string>();
  return candidates.filter(
    (candidate): candidate is CatalogueAlbumCandidate => {
      if (!candidate || seen.has(candidate.externalId)) {
        return false;
      }
      seen.add(candidate.externalId);
      return true;
    },
  );
}

function nonnegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function validAlbumSearchOptions(options: CatalogueAlbumSearchOptions) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_SEARCH_LIMIT;
  return Number.isInteger(page) &&
    page >= 1 &&
    Number.isInteger(pageSize) &&
    pageSize >= 1 &&
    pageSize <= MAX_ALBUM_PAGE_SIZE
    ? { page, pageSize }
    : null;
}

function retryAfterSeconds(response: Response) {
  const header = response.headers.get("retry-after");
  if (!header) {
    return null;
  }

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const date = Date.parse(header);
  return Number.isNaN(date)
    ? null
    : Math.max(0, Math.ceil((date - Date.now()) / 1_000));
}

function coverArtUrl(value: unknown) {
  const raw = stringValue(value, 2_048);
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (
      url.hostname !== "coverartarchive.org" &&
      url.hostname !== "www.coverartarchive.org"
    ) {
      return null;
    }
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeCoverResult(
  payload: unknown,
  entityType: "release" | "release_group",
  externalId: string,
): CatalogueCoverResult {
  if (!isRecord(payload) || !Array.isArray(payload.images)) {
    return { status: "malformed_response" };
  }

  const front = payload.images.find(
    (image) =>
      isRecord(image) && image.front === true && image.approved === true,
  );
  if (!isRecord(front)) {
    return { status: "no_art" };
  }
  const thumbnails = isRecord(front.thumbnails) ? front.thumbnails : null;
  const rawCoverUrl = coverArtUrl(thumbnails?.["500"]);
  const rawOriginalUrl = coverArtUrl(front.image);
  const coverUrl = rawCoverUrl
    ? getCoverArtUrlForEntity(rawCoverUrl, entityType, externalId)
    : null;
  const originalUrl = rawOriginalUrl
    ? getCoverArtUrlForEntity(rawOriginalUrl, entityType, externalId)
    : null;
  return coverUrl && originalUrl
    ? { status: "success", coverUrl, originalUrl }
    : { status: "malformed_response" };
}

export function createMusicBrainzProvider(
  options: MusicBrainzProviderOptions = {},
): CatalogueProvider & CatalogueAlbumProvider {
  const fetchImplementation = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const sleep =
    options.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const minimumIntervalMs =
    options.minimumIntervalMs ?? DEFAULT_MINIMUM_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const inFlight = new Map<string, Promise<UpstreamResult>>();
  let requestQueue = Promise.resolve();
  let lastMusicBrainzRequestAt = Number.NEGATIVE_INFINITY;

  function scheduleMusicBrainzRequest(operation: () => Promise<Response>) {
    const request = requestQueue.then(async () => {
      const remaining = minimumIntervalMs - (now() - lastMusicBrainzRequestAt);
      if (remaining > 0) {
        await sleep(remaining);
      }
      lastMusicBrainzRequestAt = now();
      return operation();
    });
    requestQueue = request.then(
      () => undefined,
      () => undefined,
    );
    return request;
  }

  async function fetchWithTimeout(
    url: string,
    revalidate: number,
    useMusicBrainzThrottle: boolean,
  ): Promise<UpstreamResult> {
    const existing = inFlight.get(url);
    if (existing) {
      return existing;
    }

    const request = (async (): Promise<UpstreamResult> => {
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const operation = () =>
            fetchImplementation(url, {
              headers: {
                Accept: "application/json",
                "User-Agent": MUSICBRAINZ_USER_AGENT,
              },
              next: { revalidate },
              signal: controller.signal,
            });
          const response = useMusicBrainzThrottle
            ? await scheduleMusicBrainzRequest(operation)
            : await operation();

          if (
            (response.status === 429 || response.status === 503) &&
            attempt < retries
          ) {
            const retrySeconds = retryAfterSeconds(response) ?? 1;
            await sleep(Math.min(retrySeconds * 1_000, MAX_RETRY_DELAY_MS));
            continue;
          }
          let body: string | null = null;
          if (response.ok) {
            try {
              body = await response.text();
            } catch {
              body = null;
            }
          }
          return {
            status: "response",
            statusCode: response.status,
            ok: response.ok,
            retryAfterSeconds: retryAfterSeconds(response),
            body,
          };
        } catch {
          return { status: "unavailable" };
        } finally {
          clearTimeout(timeout);
        }
      }
      return { status: "unavailable" };
    })();

    inFlight.set(url, request);
    try {
      return await request;
    } finally {
      inFlight.delete(url);
    }
  }

  return {
    source: "musicbrainz",

    async searchAlbums(
      rawQuery: string,
      options: CatalogueAlbumSearchOptions = {},
    ): Promise<CatalogueAlbumSearchResult> {
      const query = rawQuery.trim().replace(/\s+/g, " ");
      const pagination = validAlbumSearchOptions(options);
      if (query.length < 2 || query.length > 200 || !pagination) {
        return {
          status: "invalid_query",
          message:
            query.length < 2 || query.length > 200
              ? "Enter between 2 and 200 characters."
              : `Choose a page size between 1 and ${MAX_ALBUM_PAGE_SIZE}.`,
        };
      }

      const { page, pageSize } = pagination;
      const search = createAlbumSearchUrl(query, page, pageSize);
      const upstream = await fetchWithTimeout(
        search.url,
        SEARCH_CACHE_SECONDS,
        true,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }
      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      if (!isRecord(payload)) {
        return { status: "malformed_response" };
      }

      const rawCandidates =
        search.mode === "text" ? payload["release-groups"] : payload.releases;
      const total = nonnegativeInteger(payload.count);
      if (!Array.isArray(rawCandidates) || total === null) {
        return { status: "malformed_response" };
      }

      const candidates = uniqueAlbums(
        search.mode === "text"
          ? rawCandidates.map((group) => normalizeAlbumCandidate(group))
          : rawCandidates.map((release) => {
              if (!isRecord(release)) return null;
              return normalizeAlbumCandidate(
                release["release-group"],
                artistCredit(release["artist-credit"]),
              );
            }),
      );
      if (rawCandidates.length > 0 && candidates.length === 0) {
        return { status: "malformed_response" };
      }

      const pageCandidates =
        search.mode === "text"
          ? candidates
          : candidates.slice((page - 1) * pageSize, page * pageSize);
      if (pageCandidates.length === 0) {
        return { status: "no_results" };
      }

      const totalResults = search.mode === "text" ? total : candidates.length;
      return {
        status: "success",
        candidates: pageCandidates,
        pagination: {
          page,
          pageSize,
          totalResults,
          hasNextPage: page * pageSize < totalResults,
        },
      };
    },

    async lookupAlbum(externalId: string): Promise<CatalogueAlbumLookupResult> {
      if (!MUSICBRAINZ_ID_PATTERN.test(externalId)) {
        return { status: "invalid_id" };
      }

      const upstream = await fetchWithTimeout(
        createAlbumLookupUrl(externalId),
        SEARCH_CACHE_SECONDS,
        true,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }
      if (upstream.statusCode === 404) {
        return { status: "not_found" };
      }
      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      const candidate = normalizeAlbumCandidate(payload);
      return candidate
        ? { status: "success", candidate }
        : { status: "malformed_response" };
    },

    async getAlbumCover(externalId: string): Promise<CatalogueCoverResult> {
      if (!MUSICBRAINZ_ID_PATTERN.test(externalId)) {
        return { status: "invalid_id" };
      }

      const upstream = await fetchWithTimeout(
        `${COVER_ART_RELEASE_GROUP_API_URL}${externalId}`,
        COVER_CACHE_SECONDS,
        false,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }
      if (upstream.statusCode === 404) {
        return { status: "no_art" };
      }
      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      return normalizeCoverResult(payload, "release_group", externalId);
    },

    async search(rawQuery: string): Promise<CatalogueSearchResult> {
      const query = rawQuery.trim().replace(/\s+/g, " ");
      if (query.length < 2 || query.length > 200) {
        return {
          status: "invalid_query",
          message: "Enter between 2 and 200 characters.",
        };
      }

      const upstream = await fetchWithTimeout(
        createSearchUrl(query),
        SEARCH_CACHE_SECONDS,
        true,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }

      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      if (!isRecord(payload) || !Array.isArray(payload.releases)) {
        return { status: "malformed_response" };
      }

      const candidates = payload.releases
        .map(normalizeCandidate)
        .filter(
          (candidate): candidate is CatalogueReleaseCandidate =>
            candidate !== null,
        );
      if (payload.releases.length > 0 && candidates.length === 0) {
        return { status: "malformed_response" };
      }
      return candidates.length > 0
        ? { status: "success", candidates }
        : { status: "no_results" };
    },

    async lookup(externalId: string): Promise<CatalogueLookupResult> {
      if (!MUSICBRAINZ_ID_PATTERN.test(externalId)) {
        return { status: "invalid_id" };
      }

      const upstream = await fetchWithTimeout(
        createLookupUrl(externalId),
        SEARCH_CACHE_SECONDS,
        true,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }
      if (upstream.statusCode === 404) {
        return { status: "not_found" };
      }
      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      const candidate = normalizeCandidate(payload);
      return candidate
        ? { status: "success", candidate }
        : { status: "malformed_response" };
    },

    async getCover(externalId: string): Promise<CatalogueCoverResult> {
      if (!MUSICBRAINZ_ID_PATTERN.test(externalId)) {
        return { status: "invalid_id" };
      }

      const upstream = await fetchWithTimeout(
        `${COVER_ART_API_URL}${externalId}`,
        COVER_CACHE_SECONDS,
        false,
      );
      if (upstream.status === "unavailable") {
        return upstream;
      }

      if (upstream.statusCode === 404) {
        return { status: "no_art" };
      }
      if (upstream.statusCode === 429 || upstream.statusCode === 503) {
        return {
          status: "rate_limited",
          retryAfterSeconds: upstream.retryAfterSeconds,
        };
      }
      if (!upstream.ok) {
        return { status: "unavailable" };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(upstream.body ?? "");
      } catch {
        return { status: "malformed_response" };
      }
      return normalizeCoverResult(payload, "release", externalId);
    },
  };
}

export const musicBrainzCatalogueProvider = createMusicBrainzProvider();
