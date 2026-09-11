"use client";

import Link from "next/link";

export default function CatalogueSearchError({ reset }: { reset: () => void }) {
  return (
    <main className="app-content">
      <section className="collection-error" role="alert">
        <div className="empty-record" aria-hidden="true" />
        <h1>Catalogue search took a detour</h1>
        <p>
          Try the search again, or keep adding records manually while the
          catalogue recovers.
        </p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="secondary-button" href="/add/manual">
            Add manually
          </Link>
        </div>
      </section>
    </main>
  );
}
