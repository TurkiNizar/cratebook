import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { WishlistForm } from "@/components/wishlist-form";
import { candidateToWishlistFormValues } from "@/lib/catalogue/forms";
import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";

import { createWishlistItem } from "./actions";

export const metadata: Metadata = { title: "Add to wishlist" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddWishlistPage({
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
      ? candidateToWishlistFormValues(lookup.candidate)
      : undefined;

  return (
    <main className="app-content manual-record-page">
      <Link className="back-link" href="/wishlist">
        ← My wishlist
      </Link>
      <p className="app-kicker">A future find</p>
      <h1>Add to wishlist</h1>
      <p className="app-description">
        {initialValues
          ? "Review the catalogue details, then add your preferred edition or spending limit if they matter."
          : "Save what you are looking for now, then add pressing preferences or a spending limit if they matter."}
      </p>
      {catalogueId && !initialValues ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>
            Catalogue details could not be loaded. Manual wishlist entry is
            still ready.
          </p>
        </div>
      ) : null}
      <WishlistForm
        action={createWishlistItem}
        entryKey={randomUUID()}
        initialValues={initialValues}
        variant="create"
      />
    </main>
  );
}
