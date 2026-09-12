import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMusicBrainzProvider } from "./musicbrainz";

const groupId = "22222222-2222-4222-8222-222222222222";
const secondGroupId = "33333333-3333-4333-8333-333333333333";

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: groupId,
    title: "Kind of Blue",
    "artist-credit": [{ name: "Miles Davis" }],
    "primary-type": "Album",
    "secondary-types": [],
    "first-release-date": "1959-08-17",
    disambiguation: "studio album",
    ...overrides,
  };
}

function provider(fetchImplementation: typeof fetch) {
  return createMusicBrainzProvider({
    fetch: fetchImplementation,
    minimumIntervalMs: 0,
    retries: 0,
  });
}

describe("MusicBrainz album discovery", () => {
  it("uses broad token-wise release-group matching and normalized album provenance", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ count: 1, "release-groups": [group()] }),
      );

    await expect(
      provider(fetchMock).searchAlbums("  Miles   Davis Kind of Blue  "),
    ).resolves.toEqual({
      status: "success",
      candidates: [
        {
          source: "musicbrainz",
          entityType: "release_group",
          externalId: groupId,
          sourceUrl: `https://musicbrainz.org/release-group/${groupId}`,
          artist: "Miles Davis",
          title: "Kind of Blue",
          originalYear: 1959,
          representativeCoverUrl: `https://coverartarchive.org/release-group/${groupId}/front-500`,
          sourceData: {
            provider: "musicbrainz",
            entityType: "release_group",
            releaseGroup: {
              id: groupId,
              title: "Kind of Blue",
              artist: "Miles Davis",
              primaryType: "Album",
              secondaryTypes: [],
              firstReleaseDate: "1959-08-17",
              disambiguation: "studio album",
            },
          },
        },
      ],
      pagination: {
        page: 1,
        pageSize: 12,
        totalResults: 1,
        hasNextPage: false,
      },
    });

    const [input, request] = fetchMock.mock.calls[0];
    const url = new URL(String(input));
    expect(url.pathname).toBe("/ws/2/release-group/");
    expect(url.searchParams.get("query")).toContain(
      "(artist:(Miles) OR releasegroup:(Miles)) AND (artist:(Davis) OR releasegroup:(Davis))",
    );
    expect(url.searchParams.get("query")).toContain("primarytype:album");
    expect(url.searchParams.get("limit")).toBe("12");
    expect(url.searchParams.get("offset")).toBe("0");
    expect(request).toMatchObject({
      headers: {
        Accept: "application/json",
        "User-Agent": "Cratebook/0.1.0 (https://cratebook.vercel.app)",
      },
      next: { revalidate: 86400 },
    });
  });

  it("supports bounded release-group pagination", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        count: 5,
        "release-groups": [
          group(),
          group({ id: secondGroupId, title: "Milestones" }),
        ],
      }),
    );
    const result = await provider(fetchMock).searchAlbums("Miles Davis", {
      page: 2,
      pageSize: 2,
    });

    expect(result).toMatchObject({
      status: "success",
      pagination: {
        page: 2,
        pageSize: 2,
        totalResults: 5,
        hasNextPage: true,
      },
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("limit")).toBe("2");
    expect(url.searchParams.get("offset")).toBe("2");
  });

  it("resolves barcodes through releases and deterministically deduplicates albums", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        count: 3,
        releases: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            "artist-credit": [{ name: "Miles Davis" }],
            "release-group": group({ "artist-credit": undefined }),
          },
          {
            id: "44444444-4444-4444-8444-444444444444",
            "artist-credit": [{ name: "Ignored duplicate artist" }],
            "release-group": group({
              title: "Ignored duplicate title",
              "artist-credit": undefined,
            }),
          },
          {
            id: "55555555-5555-4555-8555-555555555555",
            "artist-credit": [{ name: "John Coltrane" }],
            "release-group": group({
              id: secondGroupId,
              title: "Blue Train",
              "artist-credit": undefined,
              "first-release-date": "1957",
            }),
          },
        ],
      }),
    );

    const result = await provider(fetchMock).searchAlbums("8888-3716-8618", {
      pageSize: 1,
    });
    expect(result).toMatchObject({
      status: "success",
      candidates: [{ externalId: groupId, title: "Kind of Blue" }],
      pagination: {
        totalResults: 2,
        hasNextPage: true,
      },
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/ws/2/release/");
    expect(url.searchParams.get("query")).toBe("barcode:888837168618");
    expect(url.searchParams.get("limit")).toBe("100");
  });

  it("routes catalogue-number-shaped input through exact release metadata", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ count: 0, releases: [] }));

    await expect(provider(fetchMock).searchAlbums("CS 8163")).resolves.toEqual({
      status: "no_results",
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/ws/2/release/");
    expect(url.searchParams.get("query")).toBe('catno:"CS 8163"');
  });

  it("looks up an album without introducing pressing fields", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(group()));
    const catalogue = provider(fetchMock);

    await expect(catalogue.lookupAlbum(groupId)).resolves.toMatchObject({
      status: "success",
      candidate: {
        entityType: "release_group",
        externalId: groupId,
        originalYear: 1959,
      },
    });
    await expect(catalogue.lookupAlbum("not-an-id")).resolves.toEqual({
      status: "invalid_id",
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(`/ws/2/release-group/${groupId}`);
    expect(url.searchParams.get("inc")).toBe("artists");
  });

  it("accepts the concrete release artwork returned for a release group", async () => {
    const representativeReleaseId = "44444444-4444-4444-8444-444444444444";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        images: [
          {
            front: true,
            approved: true,
            image: `http://coverartarchive.org/release/${representativeReleaseId}/front`,
            thumbnails: {
              "500": `http://coverartarchive.org/release/${representativeReleaseId}/front-500`,
            },
          },
        ],
      }),
    );
    const catalogue = provider(fetchMock);

    await expect(catalogue.getAlbumCover(groupId)).resolves.toEqual({
      status: "success",
      coverUrl: `https://coverartarchive.org/release/${representativeReleaseId}/front-500`,
      originalUrl: `https://coverartarchive.org/release/${representativeReleaseId}/front`,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `https://coverartarchive.org/release-group/${groupId}`,
      expect.objectContaining({ next: { revalidate: 604800 } }),
    );

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        images: [
          {
            front: true,
            approved: true,
            image: `https://images.example.test/release/${groupId}/front`,
            thumbnails: {
              "500": `https://images.example.test/release/${groupId}/front-500`,
            },
          },
        ],
      }),
    );
    await expect(catalogue.getAlbumCover(groupId)).resolves.toEqual({
      status: "malformed_response",
    });
  });

  it("returns typed validation, rate-limit, unavailable, and malformed failures", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const catalogue = provider(fetchMock);
    await expect(catalogue.searchAlbums("x")).resolves.toMatchObject({
      status: "invalid_query",
    });
    await expect(
      catalogue.searchAlbums("Kind of Blue", { pageSize: 25 }),
    ).resolves.toMatchObject({ status: "invalid_query" });
    expect(fetchMock).not.toHaveBeenCalled();

    const rateLimited = provider(
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(null, {
          status: 429,
          headers: { "retry-after": "4" },
        }),
      ),
    );
    await expect(rateLimited.searchAlbums("Kind of Blue")).resolves.toEqual({
      status: "rate_limited",
      retryAfterSeconds: 4,
    });

    const unavailable = provider(
      vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
    );
    await expect(unavailable.searchAlbums("Kind of Blue")).resolves.toEqual({
      status: "unavailable",
    });

    const malformed = provider(
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ count: 1, items: [] })),
    );
    await expect(malformed.searchAlbums("Kind of Blue")).resolves.toEqual({
      status: "malformed_response",
    });
  });

  it("coalesces identical album searches and shares the MusicBrainz throttle", async () => {
    let resolveFirst!: (response: Response) => void;
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const catalogue = provider(fetchMock);
    const first = catalogue.searchAlbums("Kind of Blue");
    const second = catalogue.searchAlbums("Kind of Blue");

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    resolveFirst(jsonResponse({ count: 0, "release-groups": [] }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: "no_results" },
      { status: "no_results" },
    ]);
  });
});
