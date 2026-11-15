"use client";

export default function SupportError({ reset }: { reset: () => void }) {
  return (
    <main className="shell page-error" role="alert">
      <div className="state-panel error-panel">
        <h1>Something went wrong</h1>
        <p>We could not open the support directory. Please try again.</p>
        <button className="button button-primary" onClick={reset} type="button">
          Try again
        </button>
      </div>
    </main>
  );
}
