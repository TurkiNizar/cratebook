import type { Enums } from "@/types/database";

export const RELEASE_FORMAT_OPTIONS = [
  { value: "lp", label: "LP" },
  { value: "seven_inch", label: "7-inch" },
  { value: "ten_inch", label: "10-inch" },
  { value: "twelve_inch", label: "12-inch" },
  { value: "box_set", label: "Box set" },
  { value: "other", label: "Other" },
] as const satisfies ReadonlyArray<{
  value: Enums<"release_format">;
  label: string;
}>;

const RELEASE_FORMATS = new Set<string>(
  RELEASE_FORMAT_OPTIONS.map(({ value }) => value),
);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RecordDetailsField =
  | "artist"
  | "title"
  | "format"
  | "discCount"
  | "originalYear"
  | "releaseYear"
  | "label"
  | "catalogNumber"
  | "country"
  | "editionDescription"
  | "vinylColor"
  | "barcode"
  | "matrixRunout";

export type ManualRecordField = RecordDetailsField | "entryKey";

export type ManualRecordActionState = {
  message: string;
  fieldErrors: Partial<Record<ManualRecordField, string>>;
};

export type RecordDetailsInput = {
  artist: string;
  title: string;
  format: Enums<"release_format"> | null;
  discCount: number | null;
  originalYear: number | null;
  releaseYear: number | null;
  label: string | null;
  catalogNumber: string | null;
  country: string | null;
  editionDescription: string | null;
  isReissue: boolean;
  vinylColor: string | null;
  barcode: string | null;
  matrixRunout: string | null;
};

export type ManualRecordInput = RecordDetailsInput & {
  entryKey: string;
};

export type RecordDetailsValidation =
  | { success: true; data: RecordDetailsInput }
  | {
      success: false;
      errors: Partial<Record<RecordDetailsField, string>>;
    };

export type ManualRecordValidation =
  | { success: true; data: ManualRecordInput }
  | {
      success: false;
      errors: Partial<Record<ManualRecordField, string>>;
    };

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function validateLength(
  errors: Partial<Record<ManualRecordField, string>>,
  field: ManualRecordField,
  value: string | null,
  maximum: number,
  label: string,
) {
  if (value && value.length > maximum) {
    errors[field] = `${label} must be ${maximum} characters or fewer.`;
  }
}

function optionalInteger(
  formData: FormData,
  field: "discCount" | "originalYear" | "releaseYear",
  minimum: number,
  maximum: number,
  label: string,
  errors: Partial<Record<ManualRecordField, string>>,
) {
  const value = text(formData, field);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    errors[field] = `${label} must be a whole number.`;
    return null;
  }

  const parsed = Number(value);
  if (parsed < minimum || parsed > maximum) {
    errors[field] = `${label} must be between ${minimum} and ${maximum}.`;
    return null;
  }

  return parsed;
}

export function isValidRecordId(value: string) {
  return UUID_PATTERN.test(value);
}

export function validateRecordDetails(
  formData: FormData,
): RecordDetailsValidation {
  const errors: Partial<Record<ManualRecordField, string>> = {};
  const artist = text(formData, "artist");
  const title = text(formData, "title");
  const rawFormat = text(formData, "format");
  const label = optionalText(formData, "label");
  const catalogNumber = optionalText(formData, "catalogNumber");
  const country = optionalText(formData, "country");
  const editionDescription = optionalText(formData, "editionDescription");
  const vinylColor = optionalText(formData, "vinylColor");
  const barcode = optionalText(formData, "barcode");
  const matrixRunout = optionalText(formData, "matrixRunout");

  if (!artist) {
    errors.artist = "Enter the artist name.";
  } else if (artist.length > 300) {
    errors.artist = "Artist must be 300 characters or fewer.";
  }

  if (!title) {
    errors.title = "Enter the record title.";
  } else if (title.length > 300) {
    errors.title = "Title must be 300 characters or fewer.";
  }

  if (rawFormat && !RELEASE_FORMATS.has(rawFormat)) {
    errors.format = "Choose a valid format.";
  }

  validateLength(errors, "label", label, 300, "Label");
  validateLength(errors, "catalogNumber", catalogNumber, 100, "Catalog number");
  validateLength(errors, "country", country, 100, "Country");
  validateLength(
    errors,
    "editionDescription",
    editionDescription,
    1000,
    "Edition description",
  );
  validateLength(errors, "vinylColor", vinylColor, 100, "Vinyl color");
  validateLength(errors, "barcode", barcode, 100, "Barcode");
  validateLength(errors, "matrixRunout", matrixRunout, 2000, "Matrix/runout");

  const discCount = optionalInteger(
    formData,
    "discCount",
    1,
    100,
    "Disc count",
    errors,
  );
  const originalYear = optionalInteger(
    formData,
    "originalYear",
    1000,
    9999,
    "Original year",
    errors,
  );
  const releaseYear = optionalInteger(
    formData,
    "releaseYear",
    1000,
    9999,
    "Edition year",
    errors,
  );

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      artist,
      title,
      format: (rawFormat || null) as Enums<"release_format"> | null,
      discCount,
      originalYear,
      releaseYear,
      label,
      catalogNumber,
      country,
      editionDescription,
      isReissue: formData.get("isReissue") === "on",
      vinylColor,
      barcode,
      matrixRunout,
    },
  };
}

export function validateManualRecord(
  formData: FormData,
): ManualRecordValidation {
  const details = validateRecordDetails(formData);
  const entryKey = text(formData, "entryKey");

  if (!details.success) {
    return {
      success: false,
      errors: {
        ...details.errors,
        ...(isValidRecordId(entryKey)
          ? {}
          : { entryKey: "Refresh the page and try again." }),
      },
    };
  }

  if (!isValidRecordId(entryKey)) {
    return {
      success: false,
      errors: { entryKey: "Refresh the page and try again." },
    };
  }

  return {
    success: true,
    data: { ...details.data, entryKey },
  };
}
