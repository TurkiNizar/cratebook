import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Add a record" };

export default function AddPage() {
  return (
    <main className="app-content">
      <p className="app-kicker">A new find</p>
      <h1>Add a record</h1>
      <p className="app-description">
        Start from scratch now, or use catalogue search when discovery arrives
        in the next milestone.
      </p>
      <section className="add-options" aria-label="Ways to add a record">
        <Link className="add-option" href="/add/manual">
          <span className="add-option-number">01</span>
          <span>
            <strong>Add manually</strong>
            <small>Artist and title are enough to begin.</small>
          </span>
          <span aria-hidden="true">→</span>
        </Link>
        <div className="add-option add-option-disabled" aria-disabled="true">
          <span className="add-option-number">02</span>
          <span>
            <strong>Search the catalogue</strong>
            <small>Coming soon.</small>
          </span>
        </div>
      </section>
    </main>
  );
}
