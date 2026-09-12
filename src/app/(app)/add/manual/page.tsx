import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { RecordForm } from "@/components/record-form";
import {
  albumCandidateToRecordFormValues,
  candidateToRecordFormValues,
} from "@/lib/catalogue/forms";
import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";
import { getCoverArtSelectionForRelease } from "@/lib/catalogue/provenance";

import { createManualRecord } from "./actions";

export const metadata: Metadata = { title: "Add a record manually" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ManualRecordPage({
  searchParams,
}: {
  searchParams: Promise<{
    catalogueId?: string | string[];
    catalogueAlbumId?: string | string[];
    coverUrl?: string | string[];
    coverOriginalUrl?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const catalogueId = firstValue(query.catalogueId);
  const catalogueAlbumId = firstValue(query.catalogueAlbumId);
  const carriedCover = catalogueId
    ? getCoverArtSelectionForRelease(
        firstValue(query.coverUrl),
        firstValue(query.coverOriginalUrl),
        catalogueId,
      )
    : null;
  const [lookup, cover] = catalogueId
    ? await Promise.all([
        musicBrainzCatalogueProvider.lookup(catalogueId),
        carriedCover
          ? Promise.resolve({ status: "success" as const, ...carriedCover })
          : musicBrainzCatalogueProvider.getCover(catalogueId),
      ])
    : [null, null];
  const albumLookup =
    !catalogueId && catalogueAlbumId
      ? await musicBrainzCatalogueProvider.lookupAlbum(catalogueAlbumId)
      : null;
  const initialValues =
    lookup?.status === "success"
      ? candidateToRecordFormValues(lookup.candidate)
      : albumLookup?.status === "success"
        ? albumCandidateToRecordFormValues(albumLookup.candidate)
        : undefined;

  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href="/add">
        ← Add options
      </Link>
      <p className="app-kicker">Manual entry</p>
      <h1>Add a record</h1>
      <p className="app-description">
        {initialValues
          ? albumLookup?.status === "success"
            ? "The album is ready. Add only the copy or pressing details you know, or save it now and edit later."
            : "Review the catalogue details, then add copy condition, purchase details, or your story if you know them."
          : "Start with what you know. You can add copy condition, purchase details, and your story later."}
      </p>
      {catalogueId && !initialValues ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>
            Catalogue details could not be loaded. Manual entry is still ready.
          </p>
        </div>
      ) : null}
      {catalogueAlbumId && !initialValues ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>Album details could not be loaded. Manual entry is still ready.</p>
        </div>
      ) : null}
      <RecordForm
        action={createManualRecord}
        catalogueCover={cover?.status === "success" ? cover : undefined}
        catalogueId={initialValues ? catalogueId : undefined}
        entryKey={randomUUID()}
        initialValues={initialValues}
        variant="create"
      />
    </main>
  );
}
