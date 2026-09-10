"use client";

import { useActionState, useState } from "react";

import type { DeleteWishlistActionState } from "./actions";

const INITIAL_STATE: DeleteWishlistActionState = { message: "" };

export function DeleteWishlistItem({
  title,
  action,
}: {
  title: string;
  action: (
    previousState: DeleteWishlistActionState,
    formData: FormData,
  ) => Promise<DeleteWishlistActionState>;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <section
      className="record-danger-zone"
      aria-labelledby="remove-wishlist-heading"
    >
      <div>
        <p className="app-kicker">Danger zone</p>
        <h2 id="remove-wishlist-heading">Remove this wish</h2>
        <p>
          Remove this record and its private wishlist preferences. This cannot
          be undone.
        </p>
      </div>
      {!isConfirming ? (
        <button
          className="danger-button"
          type="button"
          aria-controls="delete-wishlist-confirmation"
          aria-expanded="false"
          onClick={() => setIsConfirming(true)}
        >
          Remove from wishlist
        </button>
      ) : (
        <div
          className="delete-record-confirmation"
          id="delete-wishlist-confirmation"
          role="group"
          aria-labelledby="delete-wishlist-question"
        >
          <p id="delete-wishlist-question">
            Remove <strong>{title}</strong>?
          </p>
          <form action={formAction}>
            <button
              className="secondary-button"
              type="button"
              autoFocus
              disabled={isPending}
              onClick={() => setIsConfirming(false)}
            >
              Keep wish
            </button>
            <button
              className="danger-button"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Removing…" : "Yes, remove this wish"}
            </button>
          </form>
        </div>
      )}
      {state.message ? (
        <p className="form-message form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
