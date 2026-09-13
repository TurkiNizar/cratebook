"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { DeleteAccountActionState } from "./delete-account-actions";

const INITIAL_STATE: DeleteAccountActionState = { message: "" };

type DeleteAccountProps = {
  action: (
    previousState: DeleteAccountActionState,
    formData: FormData,
  ) => Promise<DeleteAccountActionState>;
};

export function DeleteAccount({ action }: DeleteAccountProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocus = useRef(false);

  useEffect(() => {
    if (!isConfirming && shouldRestoreFocus.current) {
      triggerRef.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [isConfirming]);

  function cancelConfirmation() {
    shouldRestoreFocus.current = true;
    setIsConfirming(false);
  }

  return (
    <section
      className="record-danger-zone settings-account-deletion"
      aria-labelledby="delete-account-heading"
    >
      <div>
        <p className="app-kicker">Danger zone</p>
        <h2 id="delete-account-heading">Delete account</h2>
        <p>
          Permanently delete your profile, collection, wishlist, tags, and
          sign-in. Cratebook stores no uploaded images in the MVP; remote cover
          references disappear with your records. This cannot be undone.
        </p>
      </div>

      {!isConfirming ? (
        <button
          ref={triggerRef}
          className="danger-button"
          type="button"
          aria-controls="delete-account-confirmation"
          aria-expanded="false"
          onClick={() => setIsConfirming(true)}
        >
          Delete my account
        </button>
      ) : (
        <div
          className="delete-record-confirmation"
          id="delete-account-confirmation"
          role="group"
          aria-labelledby="delete-account-question"
        >
          <p id="delete-account-question">
            Delete your entire Cratebook account?
          </p>
          <form action={formAction}>
            <div className="field">
              <label htmlFor="delete-account-confirmation-text">
                Type DELETE to confirm
              </label>
              <input
                id="delete-account-confirmation-text"
                name="confirmation"
                type="text"
                autoCapitalize="characters"
                autoComplete="off"
                pattern="DELETE"
                required
                disabled={isPending}
              />
            </div>
            <div className="delete-account-actions">
              <button
                className="secondary-button"
                type="button"
                autoFocus
                disabled={isPending}
                onClick={cancelConfirmation}
              >
                Keep my account
              </button>
              <button
                className="danger-button"
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete account permanently"}
              </button>
            </div>
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
