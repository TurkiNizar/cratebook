"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import {
  type ManualRecordActionState,
  type ManualRecordField,
  RELEASE_FORMAT_OPTIONS,
} from "@/lib/record";

const INITIAL_ACTION_STATE: ManualRecordActionState = {
  message: "",
  fieldErrors: {},
};

export type RecordFormValues = Record<
  Exclude<ManualRecordField, "entryKey">,
  string
> & {
  isReissue: boolean;
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
  isReissue: false,
};

type RecordFormAction = (
  previousState: ManualRecordActionState,
  formData: FormData,
) => Promise<ManualRecordActionState>;

type RecordFormProps = {
  action: RecordFormAction;
  variant: "create" | "edit";
  initialValues?: RecordFormValues;
  entryKey?: string;
  cancelHref?: string;
};

type TextFieldProps = {
  id: Exclude<ManualRecordField, "entryKey" | "format">;
  label: string;
  value: string;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric";
  type?: "text" | "number";
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
  cancelHref,
}: RecordFormProps) {
  const [actionState, formAction, isPending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );
  const [values, setValues] = useState(
    () => initialValues ?? EMPTY_RECORD_FORM_VALUES,
  );

  function updateValue(field: keyof RecordFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const errors = actionState.fieldErrors;
  const isEditing = variant === "edit";
  const submitLabel = isEditing ? "Save changes" : "Add to my collection";
  const pendingLabel = isEditing ? "Saving changes…" : "Adding record…";

  return (
    <form className="manual-record-form" action={formAction}>
      {entryKey ? (
        <input type="hidden" name="entryKey" value={entryKey} />
      ) : null}

      <section className="form-section" aria-labelledby="record-basics-heading">
        <div className="form-section-heading">
          <p className="app-kicker">The essentials</p>
          <h2 id="record-basics-heading">
            {isEditing ? "Name this record" : "What are you adding?"}
          </h2>
          <p>
            Artist and title are required. Keep the rest as simple or precise as
            you like.
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
      </section>

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
                errors.matrixRunout ? "matrixRunout-error" : "matrixRunout-hint"
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

      {actionState.message ? (
        <p className="form-message form-message-error" role="alert">
          {actionState.message}
        </p>
      ) : null}

      <div className="manual-form-actions">
        <p>
          {isEditing
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
