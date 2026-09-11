import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMusicBrainzProvider } from "./musicbrainz";

const releaseId = "11111111-1111-4111-8111-111111111111";

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function release(overrides: Record<string, unknown> = {}) {
  return {
    id: releaseId,
    title: "Kind of Blue",
    date: "1959-08-17",
    country: "US",
    barcode: "012345678905",
    disambiguation: "Stereo edition",
    packaging: "Cardboard/Paper Sleeve",
    "artist-credit": [{ name: "Miles Davis", joinphrase: "" }],
    "release-group": {
      id: "22222222-2222-4222-8222-222222222222",
      "primary-type": "Album",
      "first-release-date": "1959-08-17",
    },
    "label-info": [
      {
        "catalog-number": "CS 8163",
        label: {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Columbia",
        },
      },
    ],
    media: [
      { position: 1, format: '12" Vinyl', "track-count": 5 },
      { position: 2, format: '12" Vinyl', "track-count": 4 },
    ],
    ...overrides,
  };
}

describe("MusicBrainz catalogue provider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes vinyl release metadata and bounded provenance", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ releases: [release()] }),
    );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.search("  Miles   Davis  ")).resolves.toEqual({
      status: "success",
      candidates: [
        expect.objectContaining({
          source: "musicbrainz",
          externalId: releaseId,
          sourceUrl: `https://musicbrainz.org/release/${releaseId}`,
          artist: "Miles Davis",
          title: "Kind of Blue",
          format: "lp",
          discCount: 2,
          originalYear: 1959,
          releaseYear: 1959,
          label: "Columbia",
          catalogNumber: "CS 8163",
          country: "US",
          editionDescription: "Stereo edition",
          barcode: "012345678905",
          sourceData: expect.objectContaining({
            provider: "musicbrainz",
            release: expect.objectContaining({
              id: releaseId,
              title: "Kind of Blue",
            }),
          }),
        }),
      ],
    });

    const [url, request] = fetchMock.mock.calls[0];
    const parsedUrl = new URL(String(url));
    expect(parsedUrl.origin + parsedUrl.pathname).toBe(
      "https://musicbrainz.org/ws/2/release/",
    );
    expect(parsedUrl.searchParams.get("query")).toContain("format:vinyl");
    expect(parsedUrl.searchParams.get("query")).toContain("Miles Davis");
    expect(parsedUrl.searchParams.get("limit")).toBe("12");
    expect(request).toMatchObject({
      headers: {
        Accept: "application/json",
        "User-Agent": "Cratebook/0.1.0 (https://cratebook.vercel.app)",
      },
      next: { revalidate: 86400 },
    });
  });

  it("rejects unsafe query sizes without contacting the provider", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const provider = createMusicBrainzProvider({ fetch: fetchMock });

    await expect(provider.search("x")).resolves.toEqual({
      status: "invalid_query",
      message: "Enter between 2 and 200 characters.",
    });
    await expect(provider.search("x".repeat(201))).resolves.toMatchObject({
      status: "invalid_query",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("escapes Lucene control characters and coalesces identical calls", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    const first = provider.search("AC/DC: Live");
    const second = provider.search("AC/DC: Live");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const query = new URL(String(fetchMock.mock.calls[0][0])).searchParams.get(
      "query",
    );
    expect(query).toContain("AC\\/DC\\: Live");

    resolveResponse(jsonResponse({ releases: [] }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: "no_results" },
      { status: "no_results" },
    ]);
  });

  it("serializes distinct MusicBrainz calls at one-second intervals", async () => {
    let time = 10_000;
    const sleeps: number[] = [];
    const starts: number[] = [];
    const fetchMock = vi.fn<typeof fetch>(async () => {
      starts.push(time);
      return jsonResponse({ releases: [] });
    });
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      now: () => time,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds);
        time += milliseconds;
      },
      retries: 0,
    });

    await Promise.all([provider.search("Miles"), provider.search("Coltrane")]);

    expect(starts).toEqual([10_000, 11_000]);
    expect(sleeps).toEqual([1_000]);
  });

  it("retries temporary throttling once and returns typed failure states", async () => {
    const sleep = vi.fn(async () => undefined);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 503,
          headers: { "retry-after": "2" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "3" },
        }),
      );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      sleep,
    });

    await expect(provider.search("Blue Train")).resolves.toEqual({
      status: "rate_limited",
      retryAfterSeconds: 3,
    });
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports unavailable and malformed responses without throwing", async () => {
    const unavailable = createMusicBrainzProvider({
      fetch: vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
      minimumIntervalMs: 0,
      retries: 0,
    });
    await expect(unavailable.search("Blue Train")).resolves.toEqual({
      status: "unavailable",
    });

    const malformed = createMusicBrainzProvider({
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ items: [] })),
      minimumIntervalMs: 0,
      retries: 0,
    });
    await expect(malformed.search("Blue Train")).resolves.toEqual({
      status: "malformed_response",
    });
  });

  it("maps non-album vinyl formats without claiming an LP", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        releases: [
          release({
            "release-group": { "primary-type": "Single" },
            media: [{ format: '12" Vinyl' }],
          }),
        ],
      }),
    );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.search("So What")).resolves.toMatchObject({
      status: "success",
      candidates: [{ format: "twelve_inch" }],
    });
  });

  it("keeps ambiguous editions as separately traceable release candidates", async () => {
    const secondReleaseId = "44444444-4444-4444-8444-444444444444";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        releases: [
          release(),
          release({
            id: secondReleaseId,
            date: "2013-11-29",
            country: "EU",
            disambiguation: "180 gram blue vinyl reissue",
            "label-info": [
              {
                "catalog-number": "MOVLP 019",
                label: { name: "Music On Vinyl" },
              },
            ],
          }),
        ],
      }),
    );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.search("Kind of Blue")).resolves.toMatchObject({
      status: "success",
      candidates: [
        {
          externalId: releaseId,
          releaseYear: 1959,
          country: "US",
          label: "Columbia",
          catalogNumber: "CS 8163",
          editionDescription: "Stereo edition",
        },
        {
          externalId: secondReleaseId,
          releaseYear: 2013,
          country: "EU",
          label: "Music On Vinyl",
          catalogNumber: "MOVLP 019",
          editionDescription: "180 gram blue vinyl reissue",
        },
      ],
    });
  });

  it("turns an upstream timeout into an unavailable result", async () => {
    const fetchMock = vi.fn<typeof fetch>((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Timed out", "AbortError"));
        });
      });
    });
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      timeoutMs: 1,
      retries: 0,
    });

    await expect(provider.search("Kind of Blue")).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("looks up a selected release by MBID with the same safe normalization", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(release()));
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.lookup(releaseId)).resolves.toMatchObject({
      status: "success",
      candidate: {
        externalId: releaseId,
        artist: "Miles Davis",
        title: "Kind of Blue",
      },
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(`/ws/2/release/${releaseId}`);
    expect(url.searchParams.get("inc")).toBe("artists+labels+release-groups");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 86400 },
    });
  });

  it("rejects invalid lookup IDs and reports missing releases", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.lookup("not-an-id")).resolves.toEqual({
      status: "invalid_id",
    });
    await expect(provider.lookup(releaseId)).resolves.toEqual({
      status: "not_found",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("Cover Art Archive adapter", () => {
  it("returns the approved front thumbnail over HTTPS with a seven-day cache", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        images: [
          {
            front: true,
            approved: true,
            image: `http://coverartarchive.org/release/${releaseId}/123.jpg`,
            thumbnails: {
              "500": `http://coverartarchive.org/release/${releaseId}/123-500.jpg`,
            },
          },
        ],
      }),
    );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.getCover(releaseId)).resolves.toEqual({
      status: "success",
      coverUrl: `https://coverartarchive.org/release/${releaseId}/123-500.jpg`,
      originalUrl: `https://coverartarchive.org/release/${releaseId}/123.jpg`,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://coverartarchive.org/release/${releaseId}`,
      expect.objectContaining({ next: { revalidate: 604800 } }),
    );
  });

  it("handles invalid IDs, missing art, and unsafe image hosts", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        jsonResponse({
          images: [
            {
              front: true,
              approved: true,
              image: "https://example.com/original.jpg",
              thumbnails: { "500": "https://example.com/cover.jpg" },
            },
          ],
        }),
      );
    const provider = createMusicBrainzProvider({
      fetch: fetchMock,
      minimumIntervalMs: 0,
      retries: 0,
    });

    await expect(provider.getCover("not-an-id")).resolves.toEqual({
      status: "invalid_id",
    });
    await expect(provider.getCover(releaseId)).resolves.toEqual({
      status: "no_art",
    });
    await expect(provider.getCover(releaseId)).resolves.toEqual({
      status: "malformed_response",
    });
  });
});
