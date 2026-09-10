import type { Enums } from "@/types/database";

import { formatPriceMinor, RECORD_CONDITION_OPTIONS } from "./record";

const FORMAT_LABELS: Record<Enums<"release_format">, string> = {
  lp: "LP",
  seven_inch: "7-inch",
  ten_inch: "10-inch",
  twelve_inch: "12-inch",
  box_set: "Box set",
  other: "Other format",
};

export function getReleaseFormatLabel(format: Enums<"release_format">) {
  return FORMAT_LABELS[format];
}

export type CollectionReleaseSummary = {
  format: Enums<"release_format"> | null;
  disc_count: number | null;
  original_year: number | null;
  release_year: number | null;
  label: string | null;
  catalog_number: string | null;
  country: string | null;
};

export function getCollectionCardDetails(release: CollectionReleaseSummary) {
  const details: string[] = [];

  if (release.format) {
    details.push(getReleaseFormatLabel(release.format));
  }

  if (release.disc_count && release.disc_count > 1) {
    details.push(`${release.disc_count} discs`);
  }

  const year = release.release_year ?? release.original_year;
  if (year) {
    details.push(String(year));
  }

  if (release.country) {
    details.push(release.country);
  }

  return details;
}

export function getCollectionCardEdition(release: CollectionReleaseSummary) {
  return [release.label, release.catalog_number].filter(Boolean).join(" · ");
}

export type RecordDetailRelease = CollectionReleaseSummary & {
  edition_description: string | null;
  is_reissue: boolean | null;
  vinyl_color: string | null;
  barcode: string | null;
  matrix_runout: string | null;
};

export function getRecordDetailRows(release: RecordDetailRelease) {
  const rows: Array<{ label: string; value: string }> = [];

  const candidates: Array<[string, string | number | null]> = [
    ["Format", release.format ? getReleaseFormatLabel(release.format) : null],
    ["Disc count", release.disc_count],
    ["Original release year", release.original_year],
    ["This edition's year", release.release_year],
    ["Label", release.label],
    ["Catalog number", release.catalog_number],
    ["Country", release.country],
    ["Edition description", release.edition_description],
    ["Reissue", release.is_reissue ? "Yes" : null],
    ["Vinyl color", release.vinyl_color],
    ["Barcode", release.barcode],
    ["Matrix / runout", release.matrix_runout],
  ];

  for (const [label, value] of candidates) {
    if (value !== null && value !== "") {
      rows.push({ label, value: String(value) });
    }
  }

  return rows;
}

export function formatCollectionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

const CONDITION_LABELS = Object.fromEntries(
  RECORD_CONDITION_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<Enums<"record_condition">, string>;

export type CopyDetailSummary = {
  purchase_state: Enums<"purchase_state">;
  media_condition: Enums<"record_condition"> | null;
  sleeve_condition: Enums<"record_condition"> | null;
  acquired_on: string | null;
  acquired_from: string | null;
  price_paid_minor: number | null;
  price_currency: string | null;
  rating: number | null;
};

export function getCopyDetailRows(copy: CopyDetailSummary) {
  const rows: Array<{ label: string; value: string }> = [];
  const candidates: Array<[string, string | null]> = [
    [
      "Bought as",
      copy.purchase_state === "unknown"
        ? null
        : copy.purchase_state === "new"
          ? "New"
          : "Used",
    ],
    [
      "Media condition",
      copy.media_condition ? CONDITION_LABELS[copy.media_condition] : null,
    ],
    [
      "Sleeve condition",
      copy.sleeve_condition ? CONDITION_LABELS[copy.sleeve_condition] : null,
    ],
    [
      "Acquired",
      copy.acquired_on ? formatCollectionDate(copy.acquired_on) : null,
    ],
    ["Acquired from", copy.acquired_from],
    [
      "Price paid",
      copy.price_paid_minor !== null && copy.price_currency
        ? formatPriceMinor(copy.price_paid_minor, copy.price_currency)
        : null,
    ],
    ["Personal rating", copy.rating ? `${copy.rating} / 5` : null],
  ];

  for (const [label, value] of candidates) {
    if (value) {
      rows.push({ label, value });
    }
  }

  return rows;
}
