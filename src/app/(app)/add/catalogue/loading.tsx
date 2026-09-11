export default function CatalogueSearchLoading() {
  return (
    <main className="app-content catalogue-search-page" aria-busy="true">
      <span className="skeleton-line skeleton-line-short" />
      <span className="skeleton-line catalogue-title-skeleton" />
      <div className="catalogue-search-skeleton">
        <span className="skeleton-line" />
        <span className="skeleton-button" />
      </div>
      <div
        className="catalogue-result-list"
        aria-label="Loading catalogue results"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <article className="catalogue-result" key={index}>
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-line-short" />
          </article>
        ))}
      </div>
    </main>
  );
}
