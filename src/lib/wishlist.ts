import type { Enums } from "@/types/database";

import {
  type CopyDetailsInput,
  type ManualRecordField,
  validateCopyDetails,
} from "./record";

export const WISHLIST_PRIORITY_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "wanted", label: "Wanted" },
  { value: "must_have", label: "Must-have" },
] as const satisfies ReadonlyArray<{
  value: Enums<"wishlist_priority">;
  label: string;
}>;

const WISHLIST_PRIORITIES = new Set<string>(
  WISHLIST_PRIORITY_OPTIONS.map(({ value }) => value),
);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WishlistField =
  | "artist"
  | "title"
  | "priority"
  | "preferredEdition"
  | "maxPrice"
  | "priceCurrency"
  | "notes"
  | "isPublic"
  | "entryKey";

export type WishlistActionState = {
  message: string;
  fieldErrors: Partial<Record<WishlistField, string>>;
};

export type WishlistInput = {
  artist: string;
  title: string;
  priority: Enums<"wishlist_priority">;
  preferredEdition: string | null;
  maxPriceMinor: number | null;
  priceCurrency: string | null;
  notes: string | null;
  isPublic: boolean;
};

export type ManualWishlistInput = WishlistInput & { entryKey: string };

type WishlistValidation =
  | { success: true; data: WishlistInput }
  | { success: false; errors: Partial<Record<WishlistField, string>> };

type ManualWishlistValidation =
  | { success: true; data: ManualWishlistInput }
  | { success: false; errors: Partial<Record<WishlistField, string>> };

type WishlistConversionValidation =
  | { success: true; data: CopyDetailsInput & { entryKey: string } }
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

function parseMaxPrice(
  amount: string,
  currency: string,
  errors: Partial<Record<WishlistField, string>>,
) {
  if (!amount && !currency) {
    return null;
  }
  if (!amount) {
    errors.maxPrice = "Enter a maximum price or clear the currency.";
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
    errors.maxPrice =
      "Enter a non-negative price using digits and a decimal point.";
    return null;
  }

  const fraction = match[2] ?? "";
  if (fraction.length > fractionDigits) {
    errors.maxPrice =
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
    errors.maxPrice = "Maximum price is too large.";
    return null;
  }
  return minor;
}

export function isValidWishlistId(value: string) {
  return UUID_PATTERN.test(value);
}

export function getWishlistPriorityLabel(priority: Enums<"wishlist_priority">) {
  return (
    WISHLIST_PRIORITY_OPTIONS.find((option) => option.value === priority)
      ?.label ?? priority
  );
}

export function validateWishlist(formData: FormData): WishlistValidation {
  const errors: Partial<Record<WishlistField, string>> = {};
  const artist = text(formData, "artist");
  const title = text(formData, "title");
  const rawPriority = text(formData, "priority") || "interested";
  const preferredEdition = optionalText(formData, "preferredEdition");
  const maxPrice = text(formData, "maxPrice");
  const priceCurrency = text(formData, "priceCurrency").toUpperCase();
  const notes = optionalText(formData, "notes");

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
  if (!WISHLIST_PRIORITIES.has(rawPriority)) {
    errors.priority = "Choose a valid priority.";
  }
  if (preferredEdition && preferredEdition.length > 1000) {
    errors.preferredEdition =
      "Preferred edition must be 1000 characters or fewer.";
  }
  if (notes && notes.length > 10000) {
    errors.notes = "Notes must be 10000 characters or fewer.";
  }

  const maxPriceMinor = parseMaxPrice(maxPrice, priceCurrency, errors);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      artist,
      title,
      priority: rawPriority as Enums<"wishlist_priority">,
      preferredEdition,
      maxPriceMinor,
      priceCurrency: priceCurrency || null,
      notes,
      isPublic: formData.get("isPublic") === "on",
    },
  };
}

export function validateManualWishlist(
  formData: FormData,
): ManualWishlistValidation {
  const validation = validateWishlist(formData);
  const entryKey = text(formData, "entryKey");

  if (!validation.success) {
    return {
      success: false,
      errors: {
        ...validation.errors,
        ...(isValidWishlistId(entryKey)
          ? {}
          : { entryKey: "Refresh the page and try again." }),
      },
    };
  }
  if (!isValidWishlistId(entryKey)) {
    return {
      success: false,
      errors: { entryKey: "Refresh the page and try again." },
    };
  }
  return { success: true, data: { ...validation.data, entryKey } };
}

export function validateWishlistConversion(
  formData: FormData,
): WishlistConversionValidation {
  const copy = validateCopyDetails(formData);
  const entryKey = text(formData, "entryKey");

  if (!copy.success) {
    return {
      success: false,
      errors: {
        ...copy.errors,
        ...(isValidWishlistId(entryKey)
          ? {}
          : { entryKey: "Refresh the page and try again." }),
      },
    };
  }
  if (!isValidWishlistId(entryKey)) {
    return {
      success: false,
      errors: { entryKey: "Refresh the page and try again." },
    };
  }
  return { success: true, data: { ...copy.data, entryKey } };
}
