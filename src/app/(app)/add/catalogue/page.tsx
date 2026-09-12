import type { Metadata } from "next";
import Link from "next/link";

import { musicBrainzCatalogueProvider } from "@/lib/catalogue/musicbrainz";

import { CatalogueSearchResults } from "./catalogue-search-results";

export const metadata: Metadata = { title: "Search the catalogue" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function positivePage(value: string | string[] | undefined) {
  const candidate = Number(firstValue(value));
  return Number.isInteger(candidate) && candidate > 0 ? candidate : 1;
}

export default async function CatalogueSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
}) {
  const parameters = await searchParams;
  const submitted = parameters.q !== undefined;
  const query = firstValue(parameters.q).trim().replace(/\s+/g, " ");
  const page = positivePage(parameters.page);
  const result = submitted
    ? await musicBrainzCatalogueProvider.searchAlbums(query, { page })
    : null;

  return (
    <main className="app-content catalogue-search-page">
      <Link className="back-link" href="/add">
        ← Add options
      </Link>
      <p className="app-kicker">MusicBrainz catalogue</p>
      <h1>Find an album</h1>
      <p className="app-description">
        Search by artist, album title, barcode, or catalogue number. Choose the
        album first; exact pressing details can wait.
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
          Album matches are supplied by MusicBrainz. Covers are representative
          artwork from the Cover Art Archive.
        </p>
      </form>

      {result ? (
        <CatalogueSearchResults query={query} result={result} />
      ) : (
        <section className="catalogue-search-intro">
          <span aria-hidden="true">01</span>
          <div>
            <h2>Start with the album you recognize</h2>
            <p>
              Artist and title are usually enough. A barcode or catalogue number
              can also find the album without making an exact pressing claim. If
              none fits, manual entry is always available.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
