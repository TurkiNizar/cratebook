"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { AlbumArtworkFinder } from "@/components/album-artwork-finder";
import {
  type ManualRecordActionState,
  type ManualRecordField,
  PURCHASE_STATE_OPTIONS,
  RECORD_CONDITION_OPTIONS,
  RELEASE_FORMAT_OPTIONS,
} from "@/lib/record";
import type {
  CatalogueArtworkSearchState,
  CatalogueArtworkSuggestion,
  CatalogueCoverSelection,
  CatalogueEntityType,
} from "@/lib/catalogue/types";

const INITIAL_ACTION_STATE: ManualRecordActionState = {
  message: "",
  fieldErrors: {},
};

const CONDITION_FIELDS = [
  ["mediaCondition", "Media condition"],
  ["sleeveCondition", "Sleeve condition"],
] as const;
const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

export type RecordFormValues = Record<
  Exclude<ManualRecordField, "entryKey" | "isFavorite">,
  string
> & {
  isReissue: boolean;
  isFavorite: boolean;
};

export const EMPTY_RECORD_FORM_VALUES: RecordFormValues = {
  artist: "",
  title: "",
  format: "",
  discCount: "",
  originalYear: "",
  releaseYear: "",
  label: "",
  catalogNumber: "",
  country: "",
  editionDescription: "",
  vinylColor: "",
  barcode: "",
  matrixRunout: "",
  purchaseState: "unknown",
  mediaCondition: "",
  sleeveCondition: "",
  acquiredOn: "",
  acquiredFrom: "",
  pricePaid: "",
  priceCurrency: "",
  rating: "",
  notes: "",
  tags: "",
  isReissue: false,
  isFavorite: false,
};

type RecordFormAction = (
  previousState: ManualRecordActionState,
  formData: FormData,
) => Promise<ManualRecordActionState>;

type RecordFormProps = {
  action: RecordFormAction;
  variant: "create" | "edit" | "convert";
  initialValues?: RecordFormValues;
  entryKey?: string;
  catalogueId?: string;
  catalogueEntityType?: CatalogueEntityType;
  catalogueCover?: CatalogueCoverSelection;
  artworkFinderAction?: (
    previousState: CatalogueArtworkSearchState,
    formData: FormData,
  ) => Promise<CatalogueArtworkSearchState>;
  cancelHref?: string;
};

type TextFieldProps = {
  id: Exclude<ManualRecordField, "entryKey" | "format" | "isFavorite">;
  label: string;
  value: string;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "decimal";
  type?: "text" | "number" | "date";
  min?: number;
  max?: number;
  onChange: (field: keyof RecordFormValues, value: string | boolean) => void;
};

function TextField({
  id,
  label,
  value,
  error,
  onChange,
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...inputProps}
        id={id}
        name={id}
        value={value}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(id, event.target.value)}
      />
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RecordForm({
  action,
  variant,
  initialValues,
  entryKey,
  catalogueId,
  catalogueEntityType,
  catalogueCover,
  artworkFinderAction,
  cancelHref,
}: RecordFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [values, setValues] = useState(
    () => initialValues ?? EMPTY_RECORD_FORM_VALUES,
  );
  const [artworkSelection, setArtworkSelection] = useState<{
    catalogueId: string;
    catalogueEntityType: CatalogueEntityType;
    cover?: CatalogueCoverSelection;
  } | null>(() =>
    catalogueId
      ? {
          catalogueId,
          catalogueEntityType: catalogueEntityType ?? "release",
          cover: catalogueCover,
        }
      : null,
  );

  function updateValue(field: keyof RecordFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
    if (artworkFinderAction && (field === "artist" || field === "title")) {
      setArtworkSelection(null);
    }
  }

  function selectArtwork(suggestion: CatalogueArtworkSuggestion | null) {
    setArtworkSelection(
      suggestion
        ? {
            catalogueId: suggestion.externalId,
            catalogueEntityType: "release_group",
            cover: {
              coverUrl: suggestion.coverUrl,
              originalUrl: suggestion.originalUrl,
            },
          }
        : null,
    );
  }

  const errors = actionState.fieldErrors;
  const isEditing = variant === "edit";
  const isConverting = variant === "convert";
  const showsCopyDetails = isEditing || isConverting;
  const duplicate = isEditing ? undefined : actionState.duplicate;
  const submitLabel = isConverting
    ? "Move to collection"
    : isEditing
      ? "Save changes"
      : duplicate
        ? "Add another copy"
        : "Add to my collection";
  const pendingLabel = isConverting
    ? "Moving to collection…"
    : isEditing
      ? "Saving changes…"
      : duplicate
        ? "Adding another copy…"
        : "Adding record…";

  return (
    <form className="manual-record-form" action={formAction}>
      {entryKey ? (
        <input type="hidden" name="entryKey" value={entryKey} />
      ) : null}
      {artworkSelection ? (
        <>
          <input
            type="hidden"
            name="catalogueId"
            value={artworkSelection.catalogueId}
          />
          <input
            type="hidden"
            name="catalogueEntityType"
            value={artworkSelection.catalogueEntityType}
          />
        </>
      ) : null}
      {artworkSelection?.cover ? (
        <>
          <input
            type="hidden"
            name="catalogueCoverUrl"
            value={artworkSelection.cover.coverUrl}
          />
          <input
            type="hidden"
            name="catalogueCoverOriginalUrl"
            value={artworkSelection.cover.originalUrl}
          />
        </>
      ) : null}
      {duplicate ? (
        <input
          type="hidden"
          name="duplicateConfirmation"
          value={duplicate.confirmationValue}
        />
      ) : null}

      {!isConverting ? (
        <section
          className="form-section"
          aria-labelledby="record-basics-heading"
        >
          <div className="form-section-heading">
            <p className="app-kicker">The essentials</p>
            <h2 id="record-basics-heading">
              {isEditing ? "Name this record" : "What are you adding?"}
            </h2>
            <p>
              Artist and title are required. Keep the rest as simple or precise
              as you like.
            </p>
          </div>

          <div className="field-grid">
            <TextField
              id="artist"
              label="Artist"
              value={values.artist}
              error={errors.artist}
              maxLength={300}
              placeholder="Nina Simone"
              required
              onChange={updateValue}
            />
            <TextField
              id="title"
              label="Album or release title"
              value={values.title}
              error={errors.title}
              maxLength={300}
              placeholder="Pastel Blues"
              required
              onChange={updateValue}
            />
            <div className="field">
              <label htmlFor="format">Format</label>
              <select
                id="format"
                name="format"
                value={values.format}
                aria-describedby={errors.format ? "format-error" : undefined}
                aria-invalid={Boolean(errors.format)}
                onChange={(event) => updateValue("format", event.target.value)}
              >
                <option value="">Not sure yet</option>
                {RELEASE_FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.format ? (
                <p className="field-error" id="format-error">
                  {errors.format}
                </p>
              ) : null}
            </div>
            <TextField
              id="discCount"
              label="Number of discs"
              value={values.discCount}
              error={errors.discCount}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              placeholder="1"
              onChange={updateValue}
            />
          </div>

          {artworkFinderAction ? (
            <AlbumArtworkFinder
              action={artworkFinderAction}
              selectedExternalId={artworkSelection?.catalogueId}
              onSelect={selectArtwork}
            />
          ) : null}
        </section>
      ) : null}

      {showsCopyDetails ? (
        <section
          className="form-section"
          aria-labelledby="copy-details-heading"
        >
          <div className="form-section-heading">
            <p className="app-kicker">Your physical copy</p>
            <h2 id="copy-details-heading">Crate details</h2>
            <p>
              {isConverting
                ? "Add what changed when this record became yours. Wishlist notes are ready below for you to keep or edit."
                : "Capture condition, where it came from, and what it means to you."}
            </p>
          </div>

          <div className="copy-preferences-grid">
            <label className="checkbox-field" htmlFor="isFavorite">
              <input
                id="isFavorite"
                name="isFavorite"
                type="checkbox"
                checked={values.isFavorite}
                onChange={(event) =>
                  updateValue("isFavorite", event.target.checked)
                }
              />
              <span>
                <strong>Favorite</strong>
                <small>Mark this as one of the records you love most.</small>
              </span>
            </label>

            <div className="field">
              <label htmlFor="rating">Personal rating</label>
              <select
                id="rating"
                name="rating"
                value={values.rating}
                aria-describedby={errors.rating ? "rating-error" : undefined}
                aria-invalid={Boolean(errors.rating)}
                onChange={(event) => updateValue("rating", event.target.value)}
              >
                <option value="">Not rated</option>
                {RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} {rating === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
              {errors.rating ? (
                <p className="field-error" id="rating-error">
                  {errors.rating}
                </p>
              ) : null}
            </div>
          </div>

          <div className="field-grid copy-fields-grid">
            <div className="field">
              <label htmlFor="purchaseState">Bought as</label>
              <select
                id="purchaseState"
                name="purchaseState"
                value={values.purchaseState}
                aria-describedby={
                  errors.purchaseState ? "purchaseState-error" : undefined
                }
                aria-invalid={Boolean(errors.purchaseState)}
                onChange={(event) =>
                  updateValue("purchaseState", event.target.value)
                }
              >
                {PURCHASE_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.purchaseState ? (
                <p className="field-error" id="purchaseState-error">
                  {errors.purchaseState}
                </p>
              ) : null}
            </div>

            {CONDITION_FIELDS.map(([id, label]) => (
              <div className="field" key={id}>
                <label htmlFor={id}>{label}</label>
                <select
                  id={id}
                  name={id}
                  value={values[id]}
                  aria-describedby={
                    errors[id] ? `${id}-error` : "condition-hint"
                  }
                  aria-invalid={Boolean(errors[id])}
                  onChange={(event) => updateValue(id, event.target.value)}
                >
                  <option value="">Not graded</option>
                  {RECORD_CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors[id] ? (
                  <p className="field-error" id={`${id}-error`}>
                    {errors[id]}
                  </p>
                ) : null}
              </div>
            ))}
            <p className="field-hint condition-hint" id="condition-hint">
              Use Goldmine grades when you know them; leaving either ungraded is
              fine.
            </p>

            <TextField
              id="acquiredOn"
              label="Acquisition date"
              value={values.acquiredOn}
              error={errors.acquiredOn}
              type="date"
              onChange={updateValue}
            />
            <TextField
              id="acquiredFrom"
              label="Acquired from"
              value={values.acquiredFrom}
              error={errors.acquiredFrom}
              maxLength={300}
              placeholder="Local record shop"
              onChange={updateValue}
            />
            <TextField
              id="pricePaid"
              label="Price paid"
              value={values.pricePaid}
              error={errors.pricePaid}
              inputMode="decimal"
              placeholder="24.99"
              onChange={updateValue}
            />
            <TextField
              id="priceCurrency"
              label="Currency"
              value={values.priceCurrency}
              error={errors.priceCurrency}
              maxLength={3}
              placeholder="USD"
              onChange={(field, value) =>
                updateValue(
                  field,
                  typeof value === "string" ? value.toUpperCase() : value,
                )
              }
            />
          </div>

          <div className="field copy-notes-field">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              name="tags"
              value={values.tags}
              aria-describedby={errors.tags ? "tags-error" : "tags-hint"}
              aria-invalid={Boolean(errors.tags)}
              placeholder="Jazz, Sunday morning, Blue Note"
              onChange={(event) => updateValue("tags", event.target.value)}
            />
            {errors.tags ? (
              <p className="field-error" id="tags-error">
                {errors.tags}
              </p>
            ) : (
              <p className="field-hint" id="tags-hint">
                Separate tags with commas. Up to 20 tags, 50 characters each.
              </p>
            )}
          </div>

          <div className="field copy-notes-field">
            <label htmlFor="notes">Personal notes or story</label>
            <textarea
              id="notes"
              name="notes"
              value={values.notes}
              maxLength={10000}
              aria-describedby={errors.notes ? "notes-error" : "notes-hint"}
              aria-invalid={Boolean(errors.notes)}
              placeholder="Where you found it, who introduced you to it, or why it stays in rotation…"
              onChange={(event) => updateValue("notes", event.target.value)}
            />
            {errors.notes ? (
              <p className="field-error" id="notes-error">
                {errors.notes}
              </p>
            ) : (
              <p className="field-hint" id="notes-hint">
                Private by default. Up to 10,000 characters.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {!isConverting ? (
        <details className="advanced-fields">
          <summary>
            <span>
              <strong>Edition details</strong>
              <small>Years, label, pressing notes, and identifiers</small>
            </span>
          </summary>
          <div className="advanced-fields-body">
            <div className="field-grid">
              <TextField
                id="originalYear"
                label="Original release year"
                value={values.originalYear}
                error={errors.originalYear}
                type="number"
                inputMode="numeric"
                min={1000}
                max={9999}
                placeholder="1965"
                onChange={updateValue}
              />
              <TextField
                id="releaseYear"
                label="This edition's year"
                value={values.releaseYear}
                error={errors.releaseYear}
                type="number"
                inputMode="numeric"
                min={1000}
                max={9999}
                placeholder="2020"
                onChange={updateValue}
              />
              <TextField
                id="label"
                label="Label"
                value={values.label}
                error={errors.label}
                maxLength={300}
                placeholder="Philips"
                onChange={updateValue}
              />
              <TextField
                id="catalogNumber"
                label="Catalog number"
                value={values.catalogNumber}
                error={errors.catalogNumber}
                maxLength={100}
                placeholder="PHS 600-187"
                onChange={updateValue}
              />
              <TextField
                id="country"
                label="Country"
                value={values.country}
                error={errors.country}
                maxLength={100}
                placeholder="US"
                onChange={updateValue}
              />
              <TextField
                id="vinylColor"
                label="Vinyl color"
                value={values.vinylColor}
                error={errors.vinylColor}
                maxLength={100}
                placeholder="Black"
                onChange={updateValue}
              />
              <TextField
                id="barcode"
                label="Barcode"
                value={values.barcode}
                error={errors.barcode}
                maxLength={100}
                inputMode="numeric"
                onChange={updateValue}
              />
            </div>

            <div className="field">
              <label htmlFor="editionDescription">
                Edition or pressing description
              </label>
              <textarea
                id="editionDescription"
                name="editionDescription"
                value={values.editionDescription}
                maxLength={1000}
                aria-describedby={
                  errors.editionDescription
                    ? "editionDescription-error"
                    : undefined
                }
                aria-invalid={Boolean(errors.editionDescription)}
                placeholder="Stereo reissue, anniversary edition…"
                onChange={(event) =>
                  updateValue("editionDescription", event.target.value)
                }
              />
              {errors.editionDescription ? (
                <p className="field-error" id="editionDescription-error">
                  {errors.editionDescription}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="matrixRunout">Matrix / runout</label>
              <textarea
                id="matrixRunout"
                name="matrixRunout"
                value={values.matrixRunout}
                maxLength={2000}
                aria-describedby={
                  errors.matrixRunout
                    ? "matrixRunout-error"
                    : "matrixRunout-hint"
                }
                aria-invalid={Boolean(errors.matrixRunout)}
                onChange={(event) =>
                  updateValue("matrixRunout", event.target.value)
                }
              />
              {errors.matrixRunout ? (
                <p className="field-error" id="matrixRunout-error">
                  {errors.matrixRunout}
                </p>
              ) : (
                <p className="field-hint" id="matrixRunout-hint">
                  Copy the markings etched or stamped near the center label.
                </p>
              )}
            </div>

            <label className="checkbox-field" htmlFor="isReissue">
              <input
                id="isReissue"
                name="isReissue"
                type="checkbox"
                checked={values.isReissue}
                onChange={(event) =>
                  updateValue("isReissue", event.target.checked)
                }
              />
              <span>
                <strong>This edition is a reissue</strong>
                <small>Leave this off if you are not sure.</small>
              </span>
            </label>
          </div>
        </details>
      ) : null}

      {duplicate ? (
        <aside className="duplicate-warning" role="status">
          <span aria-hidden="true">!</span>
          <div>
            <p className="app-kicker">Possible duplicate</p>
            <h2>This may already be in your collection</h2>
            <p>
              You already have {duplicate.copyCount}{" "}
              {duplicate.copyCount === 1 ? "copy" : "copies"} of{" "}
              <strong>{duplicate.title}</strong> by {duplicate.artist}. If this
              is another physical copy, you can still add it to your collection.
            </p>
            <Link href={`/collection/${duplicate.collectionItemId}`}>
              Review an existing copy
            </Link>
          </div>
        </aside>
      ) : null}

      {actionState.message ? (
        <p className="form-message form-message-error" role="alert">
          {actionState.message}
        </p>
      ) : null}

      <div className="manual-form-actions">
        <p>
          {isConverting
            ? "The new copy stays private. The wishlist item is removed only after the move succeeds."
            : isEditing
              ? "Changes appear anywhere this edition is shown."
              : "New records stay private unless you share them later."}
        </p>
        <div className="record-form-buttons">
          {cancelHref ? (
            <Link className="secondary-button" href={cancelHref}>
              Cancel
            </Link>
          ) : null}
          <button className="button" type="submit" disabled={isPending}>
            {isPending ? pendingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
