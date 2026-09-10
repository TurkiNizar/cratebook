import Link from "next/link";

export default function RecordNotFound() {
  return (
    <main className="app-content">
      <section className="collection-error">
        <span className="empty-record" aria-hidden="true" />
        <h1>Record not found</h1>
        <p>
          This record is not in your collection, or it may no longer be
          available.
        </p>
        <Link className="button" href="/collection">
          Back to my collection
        </Link>
      </section>
    </main>
  );
}
