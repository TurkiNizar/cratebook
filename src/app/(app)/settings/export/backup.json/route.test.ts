import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, from, getUser, queryResults } = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  queryResults: new Map<string, { data: unknown; error: unknown }>(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { GET } from "./route";

function orderedQuery(
  result: { data: unknown; error: unknown },
  orderCount: number,
) {
  function orderChain(remaining: number): { order: ReturnType<typeof vi.fn> } {
    return {
      order:
        remaining === 1
          ? vi.fn().mockResolvedValue(result)
          : vi.fn(() => orderChain(remaining - 1)),
    };
  }

  return { eq: vi.fn(() => orderChain(orderCount)) };
}

describe("complete JSON backup route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryResults.clear();
    queryResults.set("profiles", {
      data: { id: "owner-id", username: "collector", is_public: false },
      error: null,
    });
    for (const table of [
      "releases",
      "collection_items",
      "wishlist_items",
      "tags",
      "collection_item_tags",
    ]) {
      queryResults.set(table, { data: [], error: null });
    }

    createClient.mockResolvedValue({ auth: { getUser }, from });
    getUser.mockResolvedValue({
      data: { user: { id: "owner-id" } },
      error: null,
    });
    from.mockImplementation((table: string) => ({
      select: vi.fn(() => {
        const result = queryResults.get(table)!;
        if (table === "profiles") {
          return {
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue(result),
            })),
          };
        }
        return orderedQuery(result, table === "collection_item_tags" ? 3 : 2);
      }),
    }));
  });

  it("requires an authenticated owner", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(from).not.toHaveBeenCalled();
  });

  it("downloads every owner-scoped domain table in a versioned JSON envelope", async () => {
    queryResults.set("releases", {
      data: [
        {
          id: "release-id",
          created_by: "owner-id",
          source_data: { source: "musicbrainz", score: 100 },
          artwork_data: { source: "cover_art_archive" },
        },
      ],
      error: null,
    });
    queryResults.set("collection_items", {
      data: [
        {
          id: "collection-id",
          user_id: "owner-id",
          acquired_from: "Private record shop",
          price_paid_minor: 2499,
          notes: "Private collection memory",
        },
      ],
      error: null,
    });
    queryResults.set("wishlist_items", {
      data: [
        {
          id: "wishlist-id",
          user_id: "owner-id",
          max_price_minor: 7500,
          notes: "Private wishlist note",
        },
      ],
      error: null,
    });
    queryResults.set("tags", {
      data: [{ id: "tag-id", user_id: "owner-id", name: "Favorites" }],
      error: null,
    });
    queryResults.set("collection_item_tags", {
      data: [
        {
          collection_item_id: "collection-id",
          tag_id: "tag-id",
          user_id: "owner-id",
        },
      ],
      error: null,
    });

    const response = await GET();
    const backup = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="cratebook-complete-backup.json"',
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "profiles",
      "releases",
      "collection_items",
      "wishlist_items",
      "tags",
      "collection_item_tags",
    ]);
    expect(backup).toMatchObject({
      format: "cratebook-backup",
      version: 1,
      data: {
        profile: { id: "owner-id", username: "collector" },
        releases: [
          {
            source_data: { source: "musicbrainz", score: 100 },
            artwork_data: { source: "cover_art_archive" },
          },
        ],
        collection_items: [
          {
            acquired_from: "Private record shop",
            price_paid_minor: 2499,
            notes: "Private collection memory",
          },
        ],
        wishlist_items: [
          { max_price_minor: 7500, notes: "Private wishlist note" },
        ],
        tags: [{ name: "Favorites" }],
        collection_item_tags: [
          { collection_item_id: "collection-id", tag_id: "tag-id" },
        ],
      },
    });
    expect(backup.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns a private generic error without exporting a partial backup", async () => {
    queryResults.set("wishlist_items", {
      data: null,
      error: { code: "XX000", message: "private database detail" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toBe("Unable to create export");
  });
});
