"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function WishlistItemError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Wishlist item page failed", error);
  }, [error]);
  return (
    <main className="app-content">
      <section className="collection-error" role="alert">
        <span className="empty-record" aria-hidden="true" />
        <h1>We couldn’t open this wish</h1>
        <p>
          Your wishlist item is still safe. Check your connection and try again.
        </p>
        <div className="collection-error-actions">
          <button className="button" type="button" onClick={retry}>
            Try again
          </button>
          <Link className="secondary-button" href="/wishlist">
            My wishlist
          </Link>
        </div>
      </section>
    </main>
  );
}
