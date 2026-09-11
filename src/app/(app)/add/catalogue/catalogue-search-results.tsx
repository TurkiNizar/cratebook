import Link from "next/link";

import type { CatalogueSearchResult } from "@/lib/catalogue/types";

import { CatalogueResultCard } from "./catalogue-result-card";

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
  result: CatalogueSearchResult;
}) {
  if (result.status === "success") {
    return (
      <section className="catalogue-results" aria-labelledby="results-heading">
        <div className="catalogue-results-heading">
          <div>
            <p className="app-kicker">Possible editions</p>
            <h2 id="results-heading">
              {result.candidates.length}{" "}
              {result.candidates.length === 1 ? "result" : "results"}
            </h2>
          </div>
          <p>Compare the pressing details before choosing.</p>
        </div>
        <div className="catalogue-result-list">
          {result.candidates.map((candidate) => (
            <CatalogueResultCard
              candidate={candidate}
              key={candidate.externalId}
            />
          ))}
        </div>
      </section>
    );
  }

  const content =
    result.status === "no_results"
      ? {
          kicker: "No match yet",
          heading: "Nothing found for “" + query + "”",
          body: "Try an artist, release title, barcode, or catalogue number—or keep moving with manual entry.",
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
