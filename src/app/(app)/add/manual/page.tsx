import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { RecordForm } from "@/components/record-form";
import { candidateToRecordFormValues } from "@/lib/catalogue/forms";
import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";

import { createManualRecord } from "./actions";

export const metadata: Metadata = { title: "Add a record manually" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ManualRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ catalogueId?: string | string[] }>;
}) {
  const catalogueId = firstValue((await searchParams).catalogueId);
  const lookup = catalogueId
    ? await musicBrainzCatalogueProvider.lookup(catalogueId)
    : null;
  const initialValues =
    lookup?.status === "success"
      ? candidateToRecordFormValues(lookup.candidate)
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
          ? "Review the catalogue details, then add copy condition, purchase details, or your story if you know them."
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
      <RecordForm
        action={createManualRecord}
        entryKey={randomUUID()}
        initialValues={initialValues}
        variant="create"
      />
    </main>
  );
}
