"use client";

import { useState } from "react";

export function CopyProfileLink({ username }: { username: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        new URL(`/u/${username}`, window.location.origin).toString(),
      );
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="public-preview-copy">
      <button className="button button-small" type="button" onClick={copyLink}>
        Copy profile link
      </button>
      <span role="status" aria-live="polite">
        {status === "copied" ? "Profile link copied." : null}
        {status === "error" ? "Couldn’t copy the link." : null}
      </span>
    </div>
  );
}
