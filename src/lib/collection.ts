import type { Enums } from "@/types/database";

const FORMAT_LABELS: Record<Enums<"release_format">, string> = {
  lp: "LP",
  seven_inch: "7-inch",
  ten_inch: "10-inch",
  twelve_inch: "12-inch",
  box_set: "Box set",
  other: "Other format",
};

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
    details.push(FORMAT_LABELS[release.format]);
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
