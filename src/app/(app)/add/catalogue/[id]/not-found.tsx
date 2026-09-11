import Link from "next/link";

export default function CatalogueReleaseNotFound() {
  return (
    <main className="app-content">
      <section className="collection-error">
        <div className="empty-record" aria-hidden="true" />
        <h1>That catalogue release is unavailable</h1>
        <p>
          It may have been merged or removed from MusicBrainz. Search again or
          add what you know manually.
        </p>
        <div className="collection-error-actions">
          <Link className="button" href="/add/catalogue">
            Search again
          </Link>
          <Link className="secondary-button" href="/add/manual">
            Add manually
          </Link>
        </div>
      </section>
    </main>
  );
}
