"use client";

import { useActionState } from "react";

import { ReleaseCover } from "@/components/release-cover";
import type {
  CatalogueArtworkSearchState,
  CatalogueArtworkSuggestion,
} from "@/lib/catalogue/types";

const INITIAL_STATE: CatalogueArtworkSearchState = {
  status: "idle",
  message: "",
  suggestions: [],
};

type AlbumArtworkFinderProps = {
  action: (
    previousState: CatalogueArtworkSearchState,
    formData: FormData,
  ) => Promise<CatalogueArtworkSearchState>;
  selectedExternalId?: string;
  onSelect: (suggestion: CatalogueArtworkSuggestion | null) => void;
};

export function AlbumArtworkFinder({
  action,
  selectedExternalId,
  onSelect,
}: AlbumArtworkFinderProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <section className="album-artwork-finder" aria-labelledby="artwork-heading">
      <div className="album-artwork-heading">
        <div>
          <p className="app-kicker">Optional</p>
          <h3 id="artwork-heading">Album artwork</h3>
          <p>
            Find representative cover art without choosing a specific pressing.
          </p>
        </div>
        <button
          className="secondary-button"
          type="submit"
          formAction={formAction}
          disabled={isPending}
        >
          {isPending ? "Finding artwork…" : "Find album artwork"}
        </button>
      </div>

      {state.message ? (
        <p
          className={`artwork-finder-message ${state.status === "success" ? "" : "artwork-finder-message-muted"}`.trim()}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <ul
          className="artwork-suggestion-grid"
          aria-label="Album artwork suggestions"
        >
          {state.suggestions.map((suggestion) => {
            const selected = selectedExternalId === suggestion.externalId;
            return (
              <li
                className={`artwork-suggestion ${selected ? "is-selected" : ""}`.trim()}
                key={suggestion.externalId}
              >
                <button
                  type="button"
                  aria-label={`Use artwork for ${suggestion.title} by ${suggestion.artist}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(suggestion)}
                >
                  <ReleaseCover
                    className="artwork-suggestion-cover"
                    coverUrl={suggestion.coverUrl}
                    meaningful
                    sizes="(max-width: 640px) 42vw, 180px"
                    title={suggestion.title}
                  />
                  <span className="artwork-suggestion-copy">
                    <strong>{suggestion.title}</strong>
                    <span>{suggestion.artist}</span>
                    <small>
                      {suggestion.originalYear
                        ? `First released ${suggestion.originalYear}`
                        : "Release year unknown"}
                    </small>
                  </span>
                </button>
                <p>
                  Artwork from Cover Art Archive · Album data from{" "}
                  <a
                    href={suggestion.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    MusicBrainz
                  </a>
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        className="artwork-no-cover"
        type="button"
        aria-pressed={!selectedExternalId}
        onClick={() => onSelect(null)}
      >
        <span aria-hidden="true">×</span>
        <span>
          <strong>Keep no cover</strong>
          <small>Save this record without catalogue artwork.</small>
        </span>
      </button>
    </section>
  );
}
