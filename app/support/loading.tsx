export default function SupportLoading() {
  return (
    <main className="directory-main" aria-busy="true" aria-label="Loading support directory">
      <div className="directory-container">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-tabs" />
        <p className="loading-label">Loading support listings…</p>
        <div className="results-grid">
          {Array.from({ length: 6 }).map((_, index) => <div className="skeleton skeleton-card" key={index} />)}
        </div>
      </div>
    </main>
  );
}
