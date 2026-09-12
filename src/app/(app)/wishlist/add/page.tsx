import { randomUUID } from "node:crypto";

import type { Metadata } from "next";
import Link from "next/link";

import { WishlistForm } from "@/components/wishlist-form";
import {
  albumCandidateToWishlistFormValues,
  candidateToWishlistFormValues,
} from "@/lib/catalogue/forms";
import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";
import { getCoverArtSelectionForRelease } from "@/lib/catalogue/provenance";

import { createWishlistItem } from "./actions";

export const metadata: Metadata = { title: "Add to wishlist" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AddWishlistPage({
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
      ? candidateToWishlistFormValues(lookup.candidate)
      : albumLookup?.status === "success"
        ? albumCandidateToWishlistFormValues(albumLookup.candidate)
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
          ? albumLookup?.status === "success"
            ? "The album is ready. Add a preferred edition or spending limit only if it matters to you."
            : "Review the catalogue details, then add your preferred edition or spending limit if they matter."
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
      {catalogueAlbumId && !initialValues ? (
        <div className="collection-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>
            Album details could not be loaded. Manual wishlist entry is still
            ready.
          </p>
        </div>
      ) : null}
      <WishlistForm
        action={createWishlistItem}
        catalogueCover={cover?.status === "success" ? cover : undefined}
        catalogueId={initialValues ? catalogueId : undefined}
        entryKey={randomUUID()}
        initialValues={initialValues}
        variant="create"
      />
    </main>
  );
}
