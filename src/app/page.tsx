import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ArrowIcon, SearchIcon } from "@/components/icons";

const records = [
  { artist: "Miles Davis", title: "Kind of Blue", color: "blue", year: "1959" },
  {
    artist: "Nina Simone",
    title: "Pastel Blues",
    color: "ochre",
    year: "1965",
  },
  {
    artist: "Khruangbin",
    title: "Con Todo El Mundo",
    color: "rose",
    year: "2018",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="site-header content-width">
        <Link className="brand-link" href="/" aria-label="Cratebook home">
          <BrandMark />
        </Link>
        <nav aria-label="Main navigation">
          <Link className="text-link" href="/sign-in">
            Sign in
          </Link>
          <Link className="button button-small" href="/sign-in">
            Start your crate
          </Link>
        </nav>
      </header>

      <section className="hero content-width">
        <div className="hero-copy">
          <p className="eyebrow">Your records, remembered</p>
          <h1>A home for every record—and the story behind it.</h1>
          <p className="hero-intro">
            Keep track of what you own, where you found it, and what you hope to
            find next. Simple enough for a first record. Thoughtful enough for
            the hundredth.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/sign-in">
              Build your collection <ArrowIcon width={18} height={18} />
            </Link>
            <a className="text-link text-link-arrow" href="#how-it-works">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="quiet-note">
            Free to start · Private by default · Yours to export
          </p>
        </div>

        <div
          className="phone-scene"
          aria-label="Preview of a Cratebook collection"
        >
          <div className="sun-shape" />
          <div className="phone-frame">
            <div className="phone-topline">
              <BrandMark />
              <span className="avatar-placeholder">AM</span>
            </div>
            <div className="phone-heading">
              <div>
                <p className="phone-kicker">Good afternoon</p>
                <h2>My collection</h2>
              </div>
              <span className="record-count">27 records</span>
            </div>
            <div className="mock-search">
              <SearchIcon width={17} height={17} />
              <span>Search your records</span>
            </div>
            <div className="record-grid">
              {records.map((record) => (
                <article className="record-card" key={record.title}>
                  <div className={`album-art album-${record.color}`}>
                    <span className="album-disc" />
                  </div>
                  <h3>{record.title}</h3>
                  <p>{record.artist}</p>
                  <span>{record.year} · LP</span>
                </article>
              ))}
            </div>
            <div className="phone-nav" aria-hidden="true">
              <span className="phone-nav-active">
                ◉<small>Collection</small>
              </span>
              <span>
                ♡<small>Wishlist</small>
              </span>
              <span className="phone-add">+</span>
              <span>
                ○<small>Profile</small>
              </span>
            </div>
          </div>
          <div className="floating-note note-one">
            <span>Found at</span>
            <strong>Le Disquaire</strong>
          </div>
          <div className="floating-note note-two">
            <span>Wishlist</span>
            <strong>12 records</strong>
          </div>
        </div>
      </section>

      <section className="value-strip" id="how-it-works">
        <div className="content-width value-grid">
          <article>
            <span className="step-number">01</span>
            <h2>Capture it quickly</h2>
            <p>
              Add only an artist and title, or keep the pressing details when
              they matter.
            </p>
          </article>
          <article>
            <span className="step-number">02</span>
            <h2>Remember the story</h2>
            <p>
              Save where you found it, what you paid, its condition, and why it
              matters.
            </p>
          </article>
          <article>
            <span className="step-number">03</span>
            <h2>Share on your terms</h2>
            <p>
              Send friends your visible collection or wishlist while private
              details stay private.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
