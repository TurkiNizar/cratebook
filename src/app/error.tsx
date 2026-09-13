"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route failed", error);
  }, [error]);

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">Temporary problem</p>
          <h1>We couldn’t open your crate.</h1>
          <p className="auth-lead">
            Your account and records are still safe. Check your connection and
            try loading them again.
          </p>
          <button className="button" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
