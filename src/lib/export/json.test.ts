import { describe, expect, it } from "vitest";

import { createJsonBackup } from "./json";

describe("JSON backup formatting", () => {
  it("creates a versioned, readable backup without losing private or provenance data", () => {
    const backup = createJsonBackup(
      {
        profile: {
          id: "owner-id",
          username: "collector",
          display_name: "Local Collector",
          bio: "Records with a story.",
          avatar_path: null,
          is_public: false,
          created_at: "2026-09-13T08:00:00.000Z",
          updated_at: "2026-09-13T09:00:00.000Z",
        },
        releases: [
          {
            id: "release-id",
            created_by: "owner-id",
            artist_display: "Nina Simone",
            title: "Pastel Blues",
            cover_url:
              "https://coverartarchive.org/release-group/example/front-500",
            format: "lp",
            disc_count: 1,
            original_year: 1965,
            release_year: null,
            label: "Philips",
            catalog_number: null,
            country: null,
            edition_description: null,
            is_reissue: null,
            vinyl_color: null,
            barcode: null,
            matrix_runout: null,
            external_source: "musicbrainz",
            external_entity_type: "release_group",
            external_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            source_data: { title: "Pastel Blues", score: 100 },
            artwork_data: { source: "cover_art_archive" },
            created_at: "2026-09-13T08:30:00.000Z",
            updated_at: "2026-09-13T08:30:00.000Z",
          },
        ],
        collection_items: [
          {
            id: "collection-id",
            user_id: "owner-id",
            release_id: "release-id",
            entry_key: "collection-entry-key",
            purchase_state: "used",
            media_condition: "very_good_plus",
            sleeve_condition: null,
            acquired_on: "2026-09-12",
            acquired_from: "Private record shop",
            price_paid_minor: 2499,
            price_currency: "USD",
            rating: 5,
            is_favorite: true,
            notes: "Private collection memory",
            is_public: false,
            created_at: "2026-09-13T08:30:00.000Z",
            updated_at: "2026-09-13T08:30:00.000Z",
          },
        ],
        wishlist_items: [],
        tags: [
          {
            id: "tag-id",
            user_id: "owner-id",
            name: "Favorites",
            normalized_name: "favorites",
            created_at: "2026-09-13T08:30:00.000Z",
          },
        ],
        collection_item_tags: [
          {
            collection_item_id: "collection-id",
            tag_id: "tag-id",
            user_id: "owner-id",
            created_at: "2026-09-13T08:30:00.000Z",
          },
        ],
      },
      new Date("2026-09-13T10:00:00.000Z"),
    );

    expect(backup.endsWith("\n")).toBe(true);
    expect(JSON.parse(backup)).toMatchObject({
      format: "cratebook-backup",
      version: 1,
      exported_at: "2026-09-13T10:00:00.000Z",
      data: {
        profile: { username: "collector" },
        releases: [
          {
            source_data: { title: "Pastel Blues", score: 100 },
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
        tags: [{ name: "Favorites" }],
        collection_item_tags: [
          { collection_item_id: "collection-id", tag_id: "tag-id" },
        ],
      },
    });
  });
});
