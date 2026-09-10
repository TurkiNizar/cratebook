import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { RecordForm, type RecordFormValues } from "@/components/record-form";
import { formatPriceMinor } from "@/lib/record";

import { getWishlistItem } from "../data";
import { moveWishlistItemToCollection } from "./actions";

export const metadata: Metadata = { title: "Move wish to collection" };

export default async function MoveWishlistItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getWishlistItem(id);
  const release = item.releases;
  const initialValues: RecordFormValues = {
    artist: release.artist_display,
    title: release.title,
    format: release.format ?? "",
    discCount: release.disc_count?.toString() ?? "",
    originalYear: release.original_year?.toString() ?? "",
    releaseYear: release.release_year?.toString() ?? "",
    label: release.label ?? "",
    catalogNumber: release.catalog_number ?? "",
    country: release.country ?? "",
    editionDescription: release.edition_description ?? "",
    vinylColor: release.vinyl_color ?? "",
    barcode: release.barcode ?? "",
    matrixRunout: release.matrix_runout ?? "",
    purchaseState: "unknown",
    mediaCondition: "",
    sleeveCondition: "",
    acquiredOn: "",
    acquiredFrom: "",
    pricePaid: "",
    priceCurrency: item.price_currency ?? "",
    rating: "",
    notes: item.notes ?? "",
    tags: "",
    isReissue: release.is_reissue ?? false,
    isFavorite: false,
  };
  const moveWithId = moveWishlistItemToCollection.bind(null, item.id);

  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href={`/wishlist/${item.id}`}>
        ← {release.title}
      </Link>
      <p className="app-kicker">Found it</p>
      <h1>Move to collection</h1>
      <p className="app-description">
        The release details for <strong>{release.title}</strong> by{" "}
        {release.artist_display} will carry over automatically. Add only what is
        specific to the copy you found.
      </p>

      <aside className="record-detail-panel wishlist-conversion-summary">
        <p className="app-kicker">From your wishlist</p>
        {item.preferred_edition ? (
          <p>
            <strong>Edition you wanted:</strong> {item.preferred_edition}
          </p>
        ) : null}
        {item.max_price_minor !== null && item.price_currency ? (
          <p>
            <strong>Private spending limit:</strong>{" "}
            {formatPriceMinor(item.max_price_minor, item.price_currency)}. Enter
            the price you actually paid below.
          </p>
        ) : null}
        <p>
          Your wishlist notes are prefilled below. The new collection copy will
          stay private.
        </p>
      </aside>

      <RecordForm
        action={moveWithId}
        cancelHref={`/wishlist/${item.id}`}
        entryKey={randomUUID()}
        initialValues={initialValues}
        variant="convert"
      />
    </main>
  );
}
