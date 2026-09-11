import type { RecordFormValues } from "@/components/record-form";
import type { WishlistFormValues } from "@/components/wishlist-form";

import type { CatalogueReleaseCandidate } from "./types";

export function candidateToRecordFormValues(
  candidate: CatalogueReleaseCandidate,
): RecordFormValues {
  return {
    artist: candidate.artist,
    title: candidate.title,
    format: candidate.format ?? "",
    discCount: candidate.discCount?.toString() ?? "",
    originalYear: candidate.originalYear?.toString() ?? "",
    releaseYear: candidate.releaseYear?.toString() ?? "",
    label: candidate.label ?? "",
    catalogNumber: candidate.catalogNumber ?? "",
    country: candidate.country ?? "",
    editionDescription: candidate.editionDescription ?? "",
    vinylColor: "",
    barcode: candidate.barcode ?? "",
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
}

export function candidateToWishlistFormValues(
  candidate: CatalogueReleaseCandidate,
): WishlistFormValues {
  return {
    artist: candidate.artist,
    title: candidate.title,
    priority: "interested",
    preferredEdition: candidate.editionDescription ?? "",
    maxPrice: "",
    priceCurrency: "",
    notes: "",
    isPublic: false,
  };
}
