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

export const PURCHASE_STATE_OPTIONS = [
  { value: "unknown", label: "Not specified" },
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
] as const satisfies ReadonlyArray<{
  value: Enums<"purchase_state">;
  label: string;
}>;

export const RECORD_CONDITION_OPTIONS = [
  { value: "mint", label: "Mint (M)" },
  { value: "near_mint", label: "Near Mint (NM)" },
  { value: "very_good_plus", label: "Very Good Plus (VG+)" },
  { value: "very_good", label: "Very Good (VG)" },
  { value: "good_plus", label: "Good Plus (G+)" },
  { value: "good", label: "Good (G)" },
  { value: "fair", label: "Fair (F)" },
  { value: "poor", label: "Poor (P)" },
] as const satisfies ReadonlyArray<{
  value: Enums<"record_condition">;
  label: string;
}>;

const RELEASE_FORMATS = new Set<string>(
  RELEASE_FORMAT_OPTIONS.map(({ value }) => value),
);
const PURCHASE_STATES = new Set<string>(
  PURCHASE_STATE_OPTIONS.map(({ value }) => value),
);
const RECORD_CONDITIONS = new Set<string>(
  RECORD_CONDITION_OPTIONS.map(({ value }) => value),
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

export type CopyDetailsField =
  | "purchaseState"
  | "mediaCondition"
  | "sleeveCondition"
  | "acquiredOn"
  | "acquiredFrom"
  | "pricePaid"
  | "priceCurrency"
  | "rating"
  | "isFavorite"
  | "notes"
  | "tags";

export type ManualRecordField =
  RecordDetailsField | CopyDetailsField | "entryKey";

export type ManualRecordActionState = {
  message: string;
  fieldErrors: Partial<Record<ManualRecordField, string>>;
  duplicate?: {
    collectionItemId: string;
    artist: string;
    title: string;
    copyCount: number;
    confirmationValue: string;
  };
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

export type CopyDetailsInput = {
  purchaseState: Enums<"purchase_state">;
  mediaCondition: Enums<"record_condition"> | null;
  sleeveCondition: Enums<"record_condition"> | null;
  acquiredOn: string | null;
  acquiredFrom: string | null;
  pricePaidMinor: number | null;
  priceCurrency: string | null;
  rating: number | null;
  isFavorite: boolean;
  notes: string | null;
  tags: string[];
};

export type CopyDetailsValidation =
  | { success: true; data: CopyDetailsInput }
  | {
      success: false;
      errors: Partial<Record<CopyDetailsField, string>>;
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

function normalizeDuplicateText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export function getDuplicateConfirmationValue(artist: string, title: string) {
  return JSON.stringify([
    normalizeDuplicateText(artist),
    normalizeDuplicateText(title),
  ]);
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

function currencyFractionDigits(currency: string) {
  try {
    const digits = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return typeof digits === "number" ? digits : 2;
  } catch {
    return null;
  }
}

function parsePriceMinor(
  amount: string,
  currency: string,
  errors: Partial<Record<CopyDetailsField, string>>,
) {
  if (!amount && !currency) {
    return null;
  }

  if (!amount) {
    errors.pricePaid = "Enter the price paid or clear the currency.";
  }

  if (!currency) {
    errors.priceCurrency = "Enter a three-letter currency code.";
    return null;
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.priceCurrency =
      "Use a three-letter currency code such as USD or EUR.";
    return null;
  }

  if (!amount) {
    return null;
  }

  const fractionDigits = currencyFractionDigits(currency);
  const match = amount.match(/^(\d+)(?:\.(\d+))?$/);
  if (fractionDigits === null || !match) {
    errors.pricePaid =
      "Enter a non-negative price using digits and a decimal point.";
    return null;
  }

  const fraction = match[2] ?? "";
  if (fraction.length > fractionDigits) {
    errors.pricePaid =
      fractionDigits === 0
        ? `${currency} uses whole amounts without decimal places.`
        : `${currency} supports up to ${fractionDigits} decimal places.`;
    return null;
  }

  const scale = 10 ** fractionDigits;
  const minor =
    Number(match[1]) * scale +
    Number(fraction.padEnd(fractionDigits, "0") || "0");
  if (!Number.isSafeInteger(minor)) {
    errors.pricePaid = "Price is too large.";
    return null;
  }

  return minor;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateCopyDetails(formData: FormData): CopyDetailsValidation {
  const errors: Partial<Record<CopyDetailsField, string>> = {};
  const rawPurchaseState = text(formData, "purchaseState") || "unknown";
  const rawMediaCondition = text(formData, "mediaCondition");
  const rawSleeveCondition = text(formData, "sleeveCondition");
  const acquiredOn = optionalText(formData, "acquiredOn");
  const acquiredFrom = optionalText(formData, "acquiredFrom");
  const pricePaid = text(formData, "pricePaid");
  const priceCurrency = text(formData, "priceCurrency").toUpperCase();
  const rawRating = text(formData, "rating");
  const notes = optionalText(formData, "notes");
  const rawTags = text(formData, "tags");

  if (!PURCHASE_STATES.has(rawPurchaseState)) {
    errors.purchaseState = "Choose a valid purchase state.";
  }
  if (rawMediaCondition && !RECORD_CONDITIONS.has(rawMediaCondition)) {
    errors.mediaCondition = "Choose a valid media condition.";
  }
  if (rawSleeveCondition && !RECORD_CONDITIONS.has(rawSleeveCondition)) {
    errors.sleeveCondition = "Choose a valid sleeve condition.";
  }
  if (acquiredOn && !isValidIsoDate(acquiredOn)) {
    errors.acquiredOn = "Enter a valid acquisition date.";
  }
  validateLength(errors, "acquiredFrom", acquiredFrom, 300, "Acquired from");
  validateLength(errors, "notes", notes, 10000, "Notes");

  const tags: string[] = [];
  const normalizedTags = new Set<string>();
  for (const rawTag of rawTags.split(",")) {
    const tag = rawTag.trim().replace(/\s+/g, " ");
    if (!tag) {
      continue;
    }

    if (tag.length > 50) {
      errors.tags = "Each tag must be 50 characters or fewer.";
      break;
    }

    const normalized = tag.toLocaleLowerCase("en");
    if (!normalizedTags.has(normalized)) {
      normalizedTags.add(normalized);
      tags.push(tag);
    }
  }

  if (tags.length > 20) {
    errors.tags = "Add no more than 20 tags.";
  }

  let rating: number | null = null;
  if (rawRating) {
    if (!/^[1-5]$/.test(rawRating)) {
      errors.rating = "Choose a rating from 1 to 5.";
    } else {
      rating = Number(rawRating);
    }
  }

  const pricePaidMinor = parsePriceMinor(pricePaid, priceCurrency, errors);

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      purchaseState: rawPurchaseState as Enums<"purchase_state">,
      mediaCondition: (rawMediaCondition ||
        null) as Enums<"record_condition"> | null,
      sleeveCondition: (rawSleeveCondition ||
        null) as Enums<"record_condition"> | null,
      acquiredOn,
      acquiredFrom,
      pricePaidMinor,
      priceCurrency: priceCurrency || null,
      rating,
      isFavorite: formData.get("isFavorite") === "on",
      notes,
      tags,
    },
  };
}

export function formatPriceMinor(amount: number, currency: string) {
  const fractionDigits = currencyFractionDigits(currency) ?? 2;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount / 10 ** fractionDigits);
}

export function priceMinorToInput(
  amount: number | null,
  currency: string | null,
) {
  if (amount === null || !currency) {
    return "";
  }

  const fractionDigits = currencyFractionDigits(currency) ?? 2;
  const scale = 10 ** fractionDigits;
  return `${Math.floor(amount / scale)}${fractionDigits ? `.${String(amount % scale).padStart(fractionDigits, "0")}` : ""}`;
}
