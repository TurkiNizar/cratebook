"use client";

import { useActionState, useState } from "react";

import type { DeleteRecordActionState } from "./actions";

const INITIAL_STATE: DeleteRecordActionState = { message: "" };

type DeleteRecordProps = {
  title: string;
  action: (
    previousState: DeleteRecordActionState,
    formData: FormData,
  ) => Promise<DeleteRecordActionState>;
};

export function DeleteRecord({ title, action }: DeleteRecordProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  return (
    <section
      className="record-danger-zone"
      aria-labelledby="remove-record-heading"
    >
      <div>
        <p className="app-kicker">Danger zone</p>
        <h2 id="remove-record-heading">Remove this copy</h2>
        <p>
          Remove this physical copy and its private copy details from your
          collection. This cannot be undone.
        </p>
      </div>

      {!isConfirming ? (
        <button
          className="danger-button"
          type="button"
          aria-controls="delete-record-confirmation"
          aria-expanded="false"
          onClick={() => setIsConfirming(true)}
        >
          Remove from collection
        </button>
      ) : (
        <div
          className="delete-record-confirmation"
          id="delete-record-confirmation"
          role="group"
          aria-labelledby="delete-record-question"
        >
          <p id="delete-record-question">
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
              Keep record
            </button>
            <button
              className="danger-button"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Removing…" : "Yes, remove this copy"}
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
