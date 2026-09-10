import type { Metadata } from "next";
import Link from "next/link";

import { RecordForm, type RecordFormValues } from "@/components/record-form";
import { priceMinorToInput } from "@/lib/record";

import { getCollectionRecord } from "../data";
import { updateRecord } from "./actions";

export const metadata: Metadata = { title: "Edit record" };

export default async function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getCollectionRecord(id);
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
    purchaseState: item.purchase_state,
    mediaCondition: item.media_condition ?? "",
    sleeveCondition: item.sleeve_condition ?? "",
    acquiredOn: item.acquired_on ?? "",
    acquiredFrom: item.acquired_from ?? "",
    pricePaid: priceMinorToInput(item.price_paid_minor, item.price_currency),
    priceCurrency: item.price_currency ?? "",
    rating: item.rating?.toString() ?? "",
    notes: item.notes ?? "",
    tags: item.collection_item_tags
      .map(({ tags }) => tags.name)
      .sort((left, right) => left.localeCompare(right))
      .join(", "),
    isReissue: release.is_reissue ?? false,
    isFavorite: item.is_favorite,
  };
  const updateRecordWithId = updateRecord.bind(null, item.id);

  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href={`/collection/${item.id}`}>
        ← {release.title}
      </Link>
      <p className="app-kicker">Release metadata</p>
      <h1>Edit record</h1>
      <p className="app-description">
        Correct the essentials or add pressing details whenever you learn more.
      </p>
      <RecordForm
        action={updateRecordWithId}
        cancelHref={`/collection/${item.id}`}
        initialValues={initialValues}
        variant="edit"
      />
    </main>
  );
}
