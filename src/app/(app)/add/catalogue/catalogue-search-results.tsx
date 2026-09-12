import Link from "next/link";

import type { CatalogueAlbumSearchResult } from "@/lib/catalogue/types";

import { CatalogueAlbumCard } from "./catalogue-album-card";

function ManualFallback({ query }: { query: string }) {
  return (
    <div className="catalogue-fallback-actions">
      <Link className="button" href="/add/manual">
        Add manually
      </Link>
      <Link className="secondary-button" href="/wishlist/add">
        Add to wishlist manually
      </Link>
      <p>
        Your collection remains available even when catalogue search is not.
      </p>
      {query ? <p className="visually-hidden">Search was for {query}</p> : null}
    </div>
  );
}

export function CatalogueSearchResults({
  query,
  result,
}: {
  query: string;
  result: CatalogueAlbumSearchResult;
}) {
  if (result.status === "success") {
    const resultLabel = `${result.pagination.totalResults} ${result.pagination.totalResults === 1 ? "album" : "albums"}`;
    const pageHref = (page: number) => {
      const parameters = new URLSearchParams({ q: query });
      if (page > 1) parameters.set("page", String(page));
      return `/add/catalogue?${parameters.toString()}`;
    };

    return (
      <section className="catalogue-results" aria-labelledby="results-heading">
        <div className="catalogue-results-heading">
          <div>
            <p className="app-kicker">Album matches</p>
            <h2 id="results-heading">{resultLabel}</h2>
          </div>
          <p>One card per album. Artwork may represent a different edition.</p>
        </div>
        <div className="catalogue-album-grid">
          {result.candidates.map((candidate) => (
            <CatalogueAlbumCard
              candidate={candidate}
              key={candidate.externalId}
            />
          ))}
        </div>
        {result.pagination.page > 1 || result.pagination.hasNextPage ? (
          <nav
            className="catalogue-pagination"
            aria-label="Album results pages"
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

  const content =
    result.status === "no_results"
      ? {
          kicker: "No match yet",
          heading: "Nothing found for “" + query + "”",
          body: "Try an artist, album title, barcode, or catalogue number—or keep moving with manual entry.",
        }
      : result.status === "invalid_query"
        ? {
            kicker: "Check the search",
            heading: "Enter a little more detail",
            body: result.message,
          }
        : result.status === "rate_limited"
          ? {
              kicker: "Catalogue is busy",
              heading: "MusicBrainz needs a moment",
              body: result.retryAfterSeconds
                ? "Try again in about " +
                  result.retryAfterSeconds +
                  " seconds, or add the record manually now."
                : "Try again shortly, or add the record manually now.",
            }
          : {
              kicker: "Catalogue unavailable",
              heading: "Search could not finish",
              body: "Your details are safe. Try again, change the search, or use manual entry while MusicBrainz recovers.",
            };

  return (
    <section className="catalogue-empty" role="status">
      <div className="empty-record" aria-hidden="true" />
      <p className="app-kicker">{content.kicker}</p>
      <h2>{content.heading}</h2>
      <p>{content.body}</p>
      <ManualFallback query={query} />
    </section>
  );
}
