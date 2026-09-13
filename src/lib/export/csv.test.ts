import { describe, expect, it } from "vitest";

import {
  type CollectionCsvItem,
  type ExportRelease,
  type WishlistCsvItem,
  createCollectionCsv,
  createCsv,
  createWishlistCsv,
} from "./csv";

const release: ExportRelease = {
  artist_display: "Nina Simone",
  title: "Pastel Blues",
  cover_url: "https://coverartarchive.org/release-group/example/front-500",
  format: "lp",
  disc_count: 1,
  original_year: 1965,
  release_year: 2024,
  label: 'Philips, "US"',
  catalog_number: "PHS 600-187",
  country: "US",
  edition_description: "Anniversary\r\nremaster",
  is_reissue: true,
  vinyl_color: "Black",
  barcode: "0123456789012",
  matrix_runout: null,
  external_source: "musicbrainz",
  external_entity_type: "release_group",
  external_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};

describe("CSV formatting", () => {
  it("uses a UTF-8 BOM, CRLF rows, escaped quotes, and a final line break", () => {
    expect(
      createCsv(
        ["First", "Second"],
        [
          ["plain", 'comma, quote " and\nline'],
          [null, 42],
        ],
      ),
    ).toBe(
      '\uFEFFFirst,Second\r\nplain,"comma, quote "" and\nline"\r\n,42\r\n',
    );
  });

  it.each(["=2+2", "+SUM(A1:A2)", "-1+1", "@command", "  =2+2"])(
    "neutralizes the spreadsheet formula prefix in %s",
    (value) => {
      expect(createCsv(["Value"], [[value]])).toBe(
        `\uFEFFValue\r\n'${value}\r\n`,
      );
    },
  );

  it("keeps actual numeric values as numbers", () => {
    expect(createCsv(["Value"], [[-42]])).toBe("\uFEFFValue\r\n-42\r\n");
  });
});

describe("domain CSV exports", () => {
  it("creates a complete, human-readable collection row with private details", () => {
    const item: CollectionCsvItem = {
      id: "collection-id",
      created_at: "2026-09-13T09:00:00Z",
      updated_at: "2026-09-13T10:00:00Z",
      purchase_state: "used",
      media_condition: "very_good_plus",
      sleeve_condition: "near_mint",
      acquired_on: "2026-09-12",
      acquired_from: "Local shop",
      price_paid_minor: 2499,
      price_currency: "USD",
      rating: 5,
      is_favorite: true,
      notes: "A personal memory",
      is_public: false,
      collection_item_tags: [
        { tags: { name: "Soul" } },
        { tags: { name: "Favorites" } },
      ],
      releases: release,
    };

    const csv = createCollectionCsv([item]);

    expect(csv).toContain("Collection item ID,Artist,Title,Format");
    expect(csv).toContain("Personal notes,Shared publicly,Catalogue source");
    expect(csv).toContain(
      "collection-id,Nina Simone,Pastel Blues,LP,1,1965,2024",
    );
    expect(csv).toContain('"Philips, ""US"""');
    expect(csv).toContain('"Anniversary\r\nremaster"');
    expect(csv).toContain(
      "Used,Very Good Plus (VG+),Near Mint (NM),2026-09-12,Local shop,24.99,USD,5,Yes,Favorites; Soul,A personal memory,No,musicbrainz,release_group",
    );
  });

  it("creates a wishlist row with the target price and private notes", () => {
    const item: WishlistCsvItem = {
      id: "wishlist-id",
      created_at: "2026-09-13T09:00:00Z",
      updated_at: "2026-09-13T10:00:00Z",
      priority: "must_have",
      preferred_edition: "Any clean pressing",
      max_price_minor: 5000,
      price_currency: "EUR",
      notes: "Gift idea",
      is_public: true,
      releases: release,
    };

    const csv = createWishlistCsv([item]);

    expect(csv).toContain("Wishlist item ID,Artist,Title,Format");
    expect(csv).toContain(
      "Must-have,Any clean pressing,50.00,EUR,Gift idea,Yes",
    );
  });

  it("exports headers for an empty collection", () => {
    const csv = createCollectionCsv([]);

    expect(csv).toContain("Collection item ID,Artist,Title");
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
