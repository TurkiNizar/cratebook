import "server-only";

import type { Enums, Json } from "@/types/database";

import type {
  CatalogueCoverResult,
  CatalogueLookupResult,
  CatalogueProvider,
  CatalogueReleaseCandidate,
  CatalogueSearchResult,
} from "./types";

const MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2/release/";
const MUSICBRAINZ_RELEASE_URL = "https://musicbrainz.org/release/";
const COVER_ART_API_URL = "https://coverartarchive.org/release/";
const MUSICBRAINZ_USER_AGENT = "Cratebook/0.1.0 (https://cratebook.vercel.app)";
const SEARCH_CACHE_SECONDS = 24 * 60 * 60;
const COVER_CACHE_SECONDS = 7 * 24 * 60 * 60;
const DEFAULT_SEARCH_LIMIT = 12;
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

export function createMusicBrainzProvider(
  options: MusicBrainzProviderOptions = {},
): CatalogueProvider {
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
      const coverUrl = coverArtUrl(thumbnails?.["500"]);
      const originalUrl = coverArtUrl(front.image);
      return coverUrl && originalUrl
        ? { status: "success", coverUrl, originalUrl }
        : { status: "malformed_response" };
    },
  };
}

export const musicBrainzCatalogueProvider = createMusicBrainzProvider();
