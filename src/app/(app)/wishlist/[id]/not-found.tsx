import Link from "next/link";

export default function WishlistItemNotFound() {
  return (
    <main className="app-content">
      <section className="collection-error">
        <span className="empty-record" aria-hidden="true" />
        <h1>Wishlist item not found</h1>
        <p>
          This record is not on your wishlist, or it may no longer be available.
        </p>
        <Link className="button" href="/wishlist">
          Back to my wishlist
        </Link>
      </section>
    </main>
  );
}
