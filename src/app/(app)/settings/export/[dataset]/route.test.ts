import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, from, getUser, select } = vi.hoisted(() => ({
  createClient: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { GET } from "./route";

async function responseCsv(response: Response) {
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
  return Buffer.from(bytes.slice(3)).toString("utf8");
}

function queryResult(result: { data: unknown[] | null; error: unknown }) {
  const secondOrder = vi.fn().mockResolvedValue(result);
  const firstOrder = vi.fn(() => ({ order: secondOrder }));
  const eq = vi.fn(() => ({ order: firstOrder }));
  select.mockReturnValue({ eq });
  return { eq };
}

describe("CSV export route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createClient.mockResolvedValue({ auth: { getUser }, from });
    from.mockReturnValue({ select });
    getUser.mockResolvedValue({
      data: { user: { id: "owner-id" } },
      error: null,
    });
  });

  it("requires an authenticated owner", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ dataset: "collection.csv" }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(from).not.toHaveBeenCalled();
  });

  it("returns an owner-scoped downloadable collection CSV", async () => {
    const query = queryResult({ data: [], error: null });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ dataset: "collection.csv" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="cratebook-collection.csv"',
    );
    expect(from).toHaveBeenCalledWith("collection_items");
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner-id");
    expect(await responseCsv(response)).toMatch(/^Collection item ID,Artist/);
  });

  it("returns an owner-scoped downloadable wishlist CSV", async () => {
    const query = queryResult({ data: [], error: null });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ dataset: "wishlist.csv" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="cratebook-wishlist.csv"',
    );
    expect(from).toHaveBeenCalledWith("wishlist_items");
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner-id");
    expect(await responseCsv(response)).toMatch(/^Wishlist item ID,Artist/);
  });

  it("returns a private generic error without exporting partial data", async () => {
    queryResult({
      data: null,
      error: { code: "XX000", message: "private database detail" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ dataset: "collection.csv" }),
    });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Unable to create export");
  });

  it("rejects unknown export names before querying user data", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ dataset: "everything.csv" }),
    });

    expect(response.status).toBe(404);
    expect(createClient).not.toHaveBeenCalled();
  });
});
