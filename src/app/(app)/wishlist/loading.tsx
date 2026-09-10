export default function WishlistLoading() {
  return (
    <main className="app-content" aria-busy="true" aria-live="polite">
      <p className="app-kicker">The next great find</p>
      <h1>My wishlist</h1>
      <p className="app-description">Opening your want list…</p>
      <div className="collection-toolbar collection-toolbar-loading">
        <span className="skeleton-line skeleton-line-short" />
        <span className="skeleton-button" />
      </div>
      <div className="collection-grid" aria-label="Loading wishlist">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="collection-card collection-card-skeleton" key={index}>
            <span className="skeleton-cover" />
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-line-short" />
          </div>
        ))}
      </div>
    </main>
  );
}
