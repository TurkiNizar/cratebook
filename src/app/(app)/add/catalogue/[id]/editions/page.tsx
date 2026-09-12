import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";
import type { CatalogueEditionSearchResult } from "@/lib/catalogue/types";

import { CatalogueResultCard } from "../../catalogue-result-card";

export const metadata: Metadata = { title: "Choose a specific edition" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function positivePage(value: string | string[] | undefined) {
  const candidate = Number(firstValue(value));
  return Number.isInteger(candidate) && candidate > 0 ? candidate : 1;
}

function EditionResults({
  albumExternalId,
  result,
}: {
  albumExternalId: string;
  result: CatalogueEditionSearchResult;
}) {
  if (result.status === "success") {
    const resultLabel = `${result.pagination.totalResults} vinyl ${result.pagination.totalResults === 1 ? "edition" : "editions"}`;
    const pageHref = (page: number) =>
      `/add/catalogue/${albumExternalId}/editions${page > 1 ? `?page=${page}` : ""}`;

    return (
      <section className="catalogue-results" aria-labelledby="editions-heading">
        <div className="catalogue-results-heading">
          <div>
            <p className="app-kicker">MusicBrainz releases</p>
            <h2 id="editions-heading">{resultLabel}</h2>
          </div>
          <p>Compare pressing clues before choosing a release.</p>
        </div>
        <div className="catalogue-result-list">
          {result.candidates.map((candidate) => (
            <CatalogueResultCard
              albumExternalId={albumExternalId}
              candidate={candidate}
              key={candidate.externalId}
            />
          ))}
        </div>
        {result.pagination.page > 1 || result.pagination.hasNextPage ? (
          <nav
            className="catalogue-pagination"
            aria-label="Edition results pages"
          >
            {result.pagination.page > 1 ? (
              <Link
                className="secondary-button"
                href={pageHref(result.pagination.page - 1)}
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span>Page {result.pagination.page}</span>
            {result.pagination.hasNextPage ? (
              <Link
                className="secondary-button"
                href={pageHref(result.pagination.page + 1)}
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    );
  }

  if (result.status === "no_results") {
    return (
      <section className="catalogue-empty" role="status">
        <div className="empty-record" aria-hidden="true" />
        <p className="app-kicker">No editions listed</p>
        <h2>No vinyl editions were found</h2>
        <p>
          You can still add the album without choosing a pressing, or return to
          catalogue search.
        </p>
      </section>
    );
  }

  return (
    <section className="collection-error" role="alert">
      <div className="empty-record" aria-hidden="true" />
      <h2>We could not load specific editions</h2>
      <p>
        MusicBrainz may be temporarily unavailable. Album-level entry remains
        available and does not require an exact pressing.
      </p>
      <Link
        className="secondary-button"
        href={`/add/catalogue/${albumExternalId}/editions`}
      >
        Try again
      </Link>
    </section>
  );
}

export default async function CatalogueEditionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ id }, parameters] = await Promise.all([params, searchParams]);
  const page = positivePage(parameters.page);
  const [album, editions] = await Promise.all([
    musicBrainzCatalogueProvider.lookupAlbum(id),
    musicBrainzCatalogueProvider.searchAlbumEditions(id, { page }),
  ]);

  if (
    album.status === "invalid_id" ||
    album.status === "not_found" ||
    editions.status === "invalid_id"
  ) {
    notFound();
  }

  if (album.status !== "success") {
    return (
      <main className="app-content catalogue-editions-page">
        <Link className="back-link" href="/add/catalogue">
          ← Catalogue results
        </Link>
        <section className="collection-error" role="alert">
          <div className="empty-record" aria-hidden="true" />
          <h1>We could not review this album</h1>
          <p>
            MusicBrainz may be temporarily unavailable. Search again or use
            manual entry.
          </p>
          <div className="collection-error-actions">
            <Link className="button" href={`/add/catalogue/${id}/editions`}>
              Try again
            </Link>
            <Link className="secondary-button" href="/add/manual">
              Add manually
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const albumParameter = `catalogueAlbumId=${encodeURIComponent(id)}`;

  return (
    <main className="app-content catalogue-editions-page">
      <Link className="back-link" href="/add/catalogue">
        ← Album results
      </Link>
      <p className="app-kicker">Optional pressing detail</p>
      <h1>Choose a specific edition</h1>
      <p className="app-description">
        {album.candidate.title} by {album.candidate.artist}. Compare known vinyl
        releases only if pressing details matter to you.
      </p>

      <section className="catalogue-album-default" aria-label="Album-level add">
        <div>
          <h2>Not sure which pressing?</h2>
          <p>
            Keep the album match. You can add edition details later without
            making an exact-release claim now.
          </p>
        </div>
        <div>
          <Link className="button" href={`/add/manual?${albumParameter}`}>
            Add album to collection
          </Link>
          <Link
            className="secondary-button"
            href={`/wishlist/add?${albumParameter}`}
          >
            Add album to wishlist
          </Link>
        </div>
      </section>

      <EditionResults albumExternalId={id} result={editions} />
    </main>
  );
}
