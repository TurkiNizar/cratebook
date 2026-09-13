import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export default function PublicProfileNotFound() {
  return (
    <div className="public-profile-page">
      <header className="site-header public-profile-header content-width">
        <Link className="brand-link" href="/" aria-label="Cratebook home">
          <BrandMark />
        </Link>
      </header>
      <main className="public-profile-main content-width">
        <section className="collection-error public-profile-message">
          <span className="empty-record" aria-hidden="true" />
          <h1>This crate isn’t available</h1>
          <p>The profile may be private, may have moved, or may not exist.</p>
          <Link className="button" href="/">
            Visit Cratebook
          </Link>
        </section>
      </main>
    </div>
  );
}
