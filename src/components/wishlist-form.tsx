"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  type WishlistActionState,
  type WishlistField,
  WISHLIST_PRIORITY_OPTIONS,
} from "@/lib/wishlist";

const INITIAL_STATE: WishlistActionState = { message: "", fieldErrors: {} };

export type WishlistFormValues = Record<
  Exclude<WishlistField, "entryKey" | "isPublic">,
  string
> & { isPublic: boolean };

export const EMPTY_WISHLIST_VALUES: WishlistFormValues = {
  artist: "",
  title: "",
  priority: "interested",
  preferredEdition: "",
  maxPrice: "",
  priceCurrency: "",
  notes: "",
  isPublic: false,
};

type WishlistFormProps = {
  action: (
    previousState: WishlistActionState,
    formData: FormData,
  ) => Promise<WishlistActionState>;
  variant: "create" | "edit";
  entryKey?: string;
  initialValues?: WishlistFormValues;
  cancelHref?: string;
};

export function WishlistForm({
  action,
  variant,
  entryKey,
  initialValues,
  cancelHref,
}: WishlistFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [values, setValues] = useState(
    () => initialValues ?? EMPTY_WISHLIST_VALUES,
  );
  const errors = state.fieldErrors;
  const isEditing = variant === "edit";

  function update(field: keyof WishlistFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="manual-record-form wishlist-form" action={formAction}>
      {entryKey ? (
        <input type="hidden" name="entryKey" value={entryKey} />
      ) : null}

      <section
        className="form-section"
        aria-labelledby="wishlist-record-heading"
      >
        <div className="form-section-heading">
          <p className="app-kicker">The record</p>
          <h2 id="wishlist-record-heading">What are you looking for?</h2>
          <p>Artist and title are enough. You can refine the details later.</p>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="artist">Artist</label>
            <input
              id="artist"
              name="artist"
              value={values.artist}
              maxLength={300}
              required
              aria-invalid={Boolean(errors.artist)}
              aria-describedby={errors.artist ? "artist-error" : undefined}
              placeholder="Alice Coltrane"
              onChange={(event) => update("artist", event.target.value)}
            />
            {errors.artist ? (
              <p className="field-error" id="artist-error">
                {errors.artist}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="title">Album or release title</label>
            <input
              id="title"
              name="title"
              value={values.title}
              maxLength={300}
              required
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              placeholder="Journey in Satchidananda"
              onChange={(event) => update("title", event.target.value)}
            />
            {errors.title ? (
              <p className="field-error" id="title-error">
                {errors.title}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className="form-section"
        aria-labelledby="wishlist-preferences-heading"
      >
        <div className="form-section-heading">
          <p className="app-kicker">Your preferences</p>
          <h2 id="wishlist-preferences-heading">How much do you want it?</h2>
          <p>Priority helps the important finds rise to the top.</p>
        </div>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={values.priority}
              aria-invalid={Boolean(errors.priority)}
              aria-describedby={errors.priority ? "priority-error" : undefined}
              onChange={(event) => update("priority", event.target.value)}
            >
              {WISHLIST_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.priority ? (
              <p className="field-error" id="priority-error">
                {errors.priority}
              </p>
            ) : null}
          </div>
          <div className="field wishlist-price-field">
            <label htmlFor="maxPrice">Maximum price</label>
            <div>
              <input
                id="maxPrice"
                name="maxPrice"
                value={values.maxPrice}
                inputMode="decimal"
                aria-invalid={Boolean(errors.maxPrice)}
                aria-describedby={
                  errors.maxPrice ? "maxPrice-error" : "maxPrice-hint"
                }
                placeholder="75.00"
                onChange={(event) => update("maxPrice", event.target.value)}
              />
              <input
                aria-label="Currency"
                name="priceCurrency"
                value={values.priceCurrency}
                maxLength={3}
                aria-invalid={Boolean(errors.priceCurrency)}
                aria-describedby={
                  errors.priceCurrency ? "priceCurrency-error" : undefined
                }
                placeholder="USD"
                onChange={(event) =>
                  update("priceCurrency", event.target.value.toUpperCase())
                }
              />
            </div>
            {errors.maxPrice ? (
              <p className="field-error" id="maxPrice-error">
                {errors.maxPrice}
              </p>
            ) : (
              <p className="field-hint" id="maxPrice-hint">
                Private, even when this item is visible.
              </p>
            )}
            {errors.priceCurrency ? (
              <p className="field-error" id="priceCurrency-error">
                {errors.priceCurrency}
              </p>
            ) : null}
          </div>
        </div>
        <div className="field wishlist-wide-field">
          <label htmlFor="preferredEdition">
            Preferred edition or pressing
          </label>
          <textarea
            id="preferredEdition"
            name="preferredEdition"
            value={values.preferredEdition}
            maxLength={1000}
            aria-invalid={Boolean(errors.preferredEdition)}
            aria-describedby={
              errors.preferredEdition ? "preferredEdition-error" : undefined
            }
            placeholder="Original pressing, stereo reissue, any clean copy…"
            onChange={(event) => update("preferredEdition", event.target.value)}
          />
          {errors.preferredEdition ? (
            <p className="field-error" id="preferredEdition-error">
              {errors.preferredEdition}
            </p>
          ) : null}
        </div>
        <div className="field wishlist-wide-field">
          <label htmlFor="notes">Private notes</label>
          <textarea
            id="notes"
            name="notes"
            value={values.notes}
            maxLength={10000}
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "notes-error" : undefined}
            placeholder="Where you saw it, gift ideas, condition to avoid…"
            onChange={(event) => update("notes", event.target.value)}
          />
          {errors.notes ? (
            <p className="field-error" id="notes-error">
              {errors.notes}
            </p>
          ) : null}
        </div>
        <label
          className="checkbox-field wishlist-visibility"
          htmlFor="isPublic"
        >
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            checked={values.isPublic}
            onChange={(event) => update("isPublic", event.target.checked)}
          />
          <span>
            <strong>Visible when my profile is public</strong>
            <small>
              Your maximum price and private notes are never shared.
            </small>
          </span>
        </label>
      </section>

      {state.message ? (
        <p className="form-message form-message-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="manual-form-actions">
        <p>
          Wishlist items stay private unless you explicitly make them visible.
        </p>
        <div className="record-form-buttons">
          {cancelHref ? (
            <Link className="secondary-button" href={cancelHref}>
              Cancel
            </Link>
          ) : null}
          <button className="button" type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Saving…"
                : "Adding…"
              : isEditing
                ? "Save changes"
                : "Add to wishlist"}
          </button>
        </div>
      </div>
    </form>
  );
}
