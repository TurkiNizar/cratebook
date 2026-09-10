"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CollectionError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Collection page failed", error);
  }, [error]);

  return (
    <main className="app-content">
      <p className="app-kicker">Your shelves</p>
      <h1>My collection</h1>
      <section className="collection-error" role="alert">
        <span className="empty-record" aria-hidden="true" />
        <h2>We couldn’t open your crate</h2>
        <p>
          Your records are still safe. Check your connection and try loading
          them again.
        </p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={retry}>
            Try again
          </button>
          <Link className="secondary-button" href="/add/manual">
            Add a record
          </Link>
        </div>
      </section>
    </main>
  );
}
