export default function RecordLoading() {
  return (
    <main
      className="app-content record-detail-page"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="skeleton-line skeleton-line-short" />
      <div className="record-hero record-hero-loading">
        <span className="skeleton-cover" />
        <div>
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line-short" />
        </div>
      </div>
      <p className="visually-hidden">Opening record…</p>
    </main>
  );
}
