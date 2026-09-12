export default function CatalogueSearchLoading() {
  return (
    <main
      className="app-content catalogue-search-page catalogue-search-loading"
      aria-busy="true"
      aria-describedby="catalogue-loading-status"
      data-testid="catalogue-search-loading"
    >
      <p
        className="visually-hidden"
        id="catalogue-loading-status"
        role="status"
      >
        Opening catalogue search…
      </p>

      <div className="catalogue-loading-header" aria-hidden="true">
        <span className="skeleton-line catalogue-back-skeleton" />
        <span className="skeleton-line catalogue-kicker-skeleton" />
        <span className="skeleton-line catalogue-title-skeleton" />
        <span className="skeleton-line catalogue-description-skeleton" />
        <span className="skeleton-line catalogue-description-skeleton-short" />
      </div>

      <div
        className="catalogue-search-form catalogue-search-form-loading"
        aria-hidden="true"
      >
        <span className="skeleton-line catalogue-label-skeleton" />
        <div>
          <span className="catalogue-input-skeleton" />
          <span className="skeleton-button" />
        </div>
        <span className="skeleton-line catalogue-attribution-skeleton" />
      </div>

      <div className="catalogue-album-grid" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <article className="catalogue-album-card" key={index}>
            <span className="catalogue-cover-skeleton" />
            <div className="catalogue-album-copy">
              <span className="skeleton-line skeleton-line-short" />
              <span className="skeleton-line" />
              <span className="skeleton-line catalogue-card-note-skeleton" />
            </div>
            <div className="catalogue-album-actions">
              <span className="skeleton-button" />
              <span className="skeleton-button" />
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
