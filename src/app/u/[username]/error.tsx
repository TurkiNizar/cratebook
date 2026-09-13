"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicProfileError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Public profile page failed", error);
  }, [error]);

  return (
    <main className="public-profile-main content-width">
      <section className="collection-error public-profile-message" role="alert">
        <span className="empty-record" aria-hidden="true" />
        <h1>We couldn’t open this crate</h1>
        <p>Check your connection and try again.</p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={retry}>
            Try again
          </button>
          <Link className="secondary-button" href="/">
            Cratebook home
          </Link>
        </div>
      </section>
    </main>
  );
}
