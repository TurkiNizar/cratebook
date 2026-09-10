"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function WishlistError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Wishlist page failed", error);
  }, [error]);

  return (
    <main className="app-content">
      <p className="app-kicker">The next great find</p>
      <h1>My wishlist</h1>
      <section className="collection-error" role="alert">
        <span className="empty-record" aria-hidden="true" />
        <h2>We couldn’t open your wishlist</h2>
        <p>
          Your wanted records are still safe. Check your connection and try
          again.
        </p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={retry}>
            Try again
          </button>
          <Link className="secondary-button" href="/wishlist/add">
            Add a wish
          </Link>
        </div>
      </section>
    </main>
  );
}
