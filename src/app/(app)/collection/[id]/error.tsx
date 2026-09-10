"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RecordError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Record page failed", error);
  }, [error]);

  return (
    <main className="app-content">
      <section className="collection-error" role="alert">
        <span className="empty-record" aria-hidden="true" />
        <h1>We couldn’t open this record</h1>
        <p>Your record is still safe. Check your connection and try again.</p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={retry}>
            Try again
          </button>
          <Link className="secondary-button" href="/collection">
            My collection
          </Link>
        </div>
      </section>
    </main>
  );
}
