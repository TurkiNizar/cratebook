import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My collection",
};

export default function CollectionPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">Your shelves</p>
      <h1>My collection</h1>
      <p className="app-description">
        Every copy gets a place here, along with where it came from and why it
        matters.
      </p>
      <section className="empty-crate">
        <div>
          <span className="empty-record" aria-hidden="true" />
          <h2>Your crate is waiting</h2>
          <p>
            Add your first record with just an artist and title. Details can
            come later.
          </p>
          <Link className="button" href="/add">
            Add your first record
          </Link>
        </div>
      </section>
    </main>
  );
}
