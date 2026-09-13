import { BrandMark } from "@/components/brand-mark";

export default function PublicProfileLoading() {
  return (
    <div className="public-profile-page" aria-busy="true" aria-live="polite">
      <header className="site-header public-profile-header content-width">
        <BrandMark />
      </header>
      <main className="public-profile-main content-width">
        <section className="public-profile-intro">
          <p className="eyebrow">Shared crate</p>
          <h1>Opening this crate…</h1>
        </section>
        <div className="collection-grid" aria-label="Loading shared records">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="collection-card collection-card-skeleton"
              key={index}
            >
              <span className="skeleton-cover" />
              <span className="skeleton-line" />
              <span className="skeleton-line skeleton-line-short" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
