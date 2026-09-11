import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Add a record" };

export default function AddPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">A new find</p>
      <h1>Add a record</h1>
      <p className="app-description">
        Search MusicBrainz for a vinyl release, or start from scratch when you
        already know the details.
      </p>
      <section className="add-options" aria-label="Ways to add a record">
        <Link className="add-option" href="/add/catalogue">
          <span className="add-option-number">01</span>
          <span>
            <strong>Search the catalogue</strong>
            <small>Find and compare vinyl editions on MusicBrainz.</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="add-option" href="/add/manual">
          <span className="add-option-number">02</span>
          <span>
            <strong>Add manually</strong>
            <small>Artist and title are enough to begin.</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="add-option" href="/wishlist/add">
          <span className="add-option-number">03</span>
          <span>
            <strong>Add to wishlist</strong>
            <small>Save a record you hope to find.</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
