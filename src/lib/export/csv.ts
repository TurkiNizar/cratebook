import {
  PURCHASE_STATE_OPTIONS,
  RECORD_CONDITION_OPTIONS,
  RELEASE_FORMAT_OPTIONS,
  priceMinorToInput,
} from "@/lib/record";
import { getWishlistPriorityLabel } from "@/lib/wishlist";
import type { Enums } from "@/types/database";

type CsvValue = string | number | boolean | null | undefined;

export type ExportRelease = {
  artist_display: string;
  title: string;
  cover_url: string | null;
  format: Enums<"release_format"> | null;
  disc_count: number | null;
  original_year: number | null;
  release_year: number | null;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
  edition_description: string | null;
  is_reissue: boolean | null;
  vinyl_color: string | null;
  barcode: string | null;
  matrix_runout: string | null;
  external_source: string | null;
  external_entity_type: Enums<"catalogue_entity_type"> | null;
  external_id: string | null;
};

export type CollectionCsvItem = {
  id: string;
  created_at: string;
  updated_at: string;
  purchase_state: Enums<"purchase_state">;
  media_condition: Enums<"record_condition"> | null;
  sleeve_condition: Enums<"record_condition"> | null;
  acquired_on: string | null;
  acquired_from: string | null;
  price_paid_minor: number | null;
  price_currency: string | null;
  rating: number | null;
  is_favorite: boolean;
  notes: string | null;
  is_public: boolean;
  collection_item_tags: Array<{ tags: { name: string } }>;
  releases: ExportRelease;
};

export type WishlistCsvItem = {
  id: string;
  created_at: string;
  updated_at: string;
  priority: Enums<"wishlist_priority">;
  preferred_edition: string | null;
  max_price_minor: number | null;
  price_currency: string | null;
  notes: string | null;
  is_public: boolean;
  releases: ExportRelease;
};

const FORMULA_PREFIX = /^[\t\r\n ]*[=+\-@]/;

function csvCell(value: CsvValue) {
  if (value === null || value === undefined) return "";

  const raw = String(value);
  const safe =
    typeof value === "string" && FORMULA_PREFIX.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function createCsv(headers: string[], rows: CsvValue[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | null,
) {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}

function yesNo(value: boolean | null) {
  return value === null ? "" : value ? "Yes" : "No";
}

function releaseValues(release: ExportRelease): CsvValue[] {
  return [
    release.artist_display,
    release.title,
    optionLabel(RELEASE_FORMAT_OPTIONS, release.format),
    release.disc_count,
    release.original_year,
    release.release_year,
    release.label,
    release.catalog_number,
    release.country,
    release.edition_description,
    yesNo(release.is_reissue),
    release.vinyl_color,
    release.barcode,
    release.matrix_runout,
    release.cover_url,
  ];
}

const RELEASE_HEADERS = [
  "Artist",
  "Title",
  "Format",
  "Disc count",
  "Original year",
  "Edition year",
  "Label",
  "Catalog number",
  "Country",
  "Edition or pressing",
  "Reissue",
  "Vinyl color",
  "Barcode",
  "Matrix or runout",
  "Cover URL",
];

export function createCollectionCsv(items: CollectionCsvItem[]) {
  return createCsv(
    [
      "Collection item ID",
      ...RELEASE_HEADERS,
      "Purchase state",
      "Media condition",
      "Sleeve condition",
      "Acquired on",
      "Acquired from",
      "Price paid",
      "Currency",
      "Rating",
      "Favorite",
      "Tags",
      "Personal notes",
      "Shared publicly",
      "Catalogue source",
      "Catalogue entity",
      "Catalogue ID",
      "Added at",
      "Updated at",
    ],
    items.map((item) => [
      item.id,
      ...releaseValues(item.releases),
      optionLabel(PURCHASE_STATE_OPTIONS, item.purchase_state),
      optionLabel(RECORD_CONDITION_OPTIONS, item.media_condition),
      optionLabel(RECORD_CONDITION_OPTIONS, item.sleeve_condition),
      item.acquired_on,
      item.acquired_from,
      priceMinorToInput(item.price_paid_minor, item.price_currency),
      item.price_currency,
      item.rating,
      yesNo(item.is_favorite),
      item.collection_item_tags
        .map(({ tags }) => tags.name)
        .toSorted((left, right) => left.localeCompare(right))
        .join("; "),
      item.notes,
      yesNo(item.is_public),
      item.releases.external_source,
      item.releases.external_entity_type,
      item.releases.external_id,
      item.created_at,
      item.updated_at,
    ]),
  );
}

export function createWishlistCsv(items: WishlistCsvItem[]) {
  return createCsv(
    [
      "Wishlist item ID",
      ...RELEASE_HEADERS,
      "Priority",
      "Preferred edition",
      "Maximum price",
      "Currency",
      "Private notes",
      "Shared publicly",
      "Catalogue source",
      "Catalogue entity",
      "Catalogue ID",
      "Added at",
      "Updated at",
    ],
    items.map((item) => [
      item.id,
      ...releaseValues(item.releases),
      getWishlistPriorityLabel(item.priority),
      item.preferred_edition,
      priceMinorToInput(item.max_price_minor, item.price_currency),
      item.price_currency,
      item.notes,
      yesNo(item.is_public),
      item.releases.external_source,
      item.releases.external_entity_type,
      item.releases.external_id,
      item.created_at,
      item.updated_at,
    ]),
  );
}
