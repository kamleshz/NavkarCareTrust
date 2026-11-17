export default function SupportLoading() {
  return (
    <main className="directory-main" aria-busy="true" aria-label="Loading listings">
      <div className="directory-container">
        <div className="skeleton skeleton-heading" />
        <p className="loading-label">Loading listings…</p>
        <div className="results-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="skeleton skeleton-card" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
