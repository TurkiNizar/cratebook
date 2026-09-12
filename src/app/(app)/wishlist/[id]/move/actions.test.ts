import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { moveWishlistItemToCollection } from "./actions";

const wishlistItemId = "11111111-1111-4111-8111-111111111111";
const entryKey = "22222222-2222-4222-8222-222222222222";

function conversionForm(confirmed = false) {
  const formData = new FormData();
  formData.set("entryKey", entryKey);
  formData.set("purchaseState", "unknown");
  formData.set("acquiredFrom", "Record fair");
  if (confirmed) {
    formData.set("duplicateConfirmation", '["miles davis","kind of blue"]');
  }
  return formData;
}

function supabaseClient() {
  const wishlistMaybeSingle = vi.fn(async () => ({
    data: {
      releases: { artist_display: "Miles Davis", title: "Kind of Blue" },
    },
    error: null,
  }));
  const duplicateMaybeSingle = vi.fn(async () => ({
    data: {
      collection_item_id: "33333333-3333-4333-8333-333333333333",
      artist_display: "Miles Davis",
      title: "Kind of Blue",
      copy_count: 1,
      created_at: "2026-09-12T12:00:00Z",
    },
    error: null,
  }));
  const rpc = vi.fn((name: string) => {
    if (name === "find_collection_duplicates") {
      return { maybeSingle: duplicateMaybeSingle };
    }
    return Promise.resolve({ data: entryKey, error: null });
  });
  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-id" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: wishlistMaybeSingle })),
      })),
    })),
    rpc,
  };

  return { client, duplicateMaybeSingle, rpc };
}

describe("moveWishlistItemToCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("warns before converting a wishlist release that is already owned", async () => {
    const { client, rpc } = supabaseClient();
    mocks.createClient.mockResolvedValue(client);

    await expect(
      moveWishlistItemToCollection(
        wishlistItemId,
        { message: "", fieldErrors: {} },
        conversionForm(),
      ),
    ).resolves.toEqual({
      message: "",
      fieldErrors: {},
      duplicate: {
        collectionItemId: "33333333-3333-4333-8333-333333333333",
        artist: "Miles Davis",
        title: "Kind of Blue",
        copyCount: 1,
        confirmationValue: '["miles davis","kind of blue"]',
      },
    });
    expect(rpc).not.toHaveBeenCalledWith(
      "convert_wishlist_item_to_collection",
      expect.anything(),
    );
  });

  it("converts after duplicate confirmation and keeps the entry key", async () => {
    const { client, duplicateMaybeSingle, rpc } = supabaseClient();
    mocks.createClient.mockResolvedValue(client);
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      moveWishlistItemToCollection(
        wishlistItemId,
        { message: "", fieldErrors: {} },
        conversionForm(true),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(duplicateMaybeSingle).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "convert_wishlist_item_to_collection",
      expect.objectContaining({
        p_wishlist_item_id: wishlistItemId,
        p_entry_key: entryKey,
        p_acquired_from: "Record fair",
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/wishlist");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/collection");
    expect(mocks.redirect).toHaveBeenCalledWith(
      `/collection/${entryKey}?moved=1`,
    );
  });
});
