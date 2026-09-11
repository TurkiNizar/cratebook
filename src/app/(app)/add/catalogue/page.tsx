import type { Metadata } from "next";
import Link from "next/link";

import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";

import { CatalogueSearchResults } from "./catalogue-search-results";

export const metadata: Metadata = { title: "Search the catalogue" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CatalogueSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const parameters = await searchParams;
  const submitted = parameters.q !== undefined;
  const query = firstValue(parameters.q).trim().replace(/\s+/g, " ");
  const result = submitted
    ? await musicBrainzCatalogueProvider.search(query)
    : null;

  return (
    <main className="app-content catalogue-search-page">
      <Link className="back-link" href="/add">
        ← Add options
      </Link>
      <p className="app-kicker">MusicBrainz catalogue</p>
      <h1>Find a release</h1>
      <p className="app-description">
        Search by artist, title, barcode, or catalogue number. You will review
        the edition before anything is added.
      </p>

      <form
        className="catalogue-search-form"
        action="/add/catalogue"
        method="get"
      >
        <label htmlFor="catalogue-query">Artist, title, or identifier</label>
        <div>
          <input
            id="catalogue-query"
            name="q"
            type="search"
            defaultValue={query}
            minLength={2}
            maxLength={200}
            placeholder="Miles Davis, Kind of Blue, or CS 8163"
            autoComplete="off"
            required
          />
          <button className="button" type="submit">
            Search
          </button>
        </div>
        <p>
          Results are supplied by MusicBrainz and limited to vinyl releases.
        </p>
      </form>

      {result ? (
        <CatalogueSearchResults query={query} result={result} />
      ) : (
        <section className="catalogue-search-intro">
          <span aria-hidden="true">01</span>
          <div>
            <h2>Start broad, then compare editions</h2>
            <p>
              A year, label, catalogue number, country, or barcode can help
              distinguish similar pressings. If none fits, manual entry is
              always available.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
