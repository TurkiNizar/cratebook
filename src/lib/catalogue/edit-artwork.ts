import type { Json } from "@/types/database";

import { musicBrainzCatalogueProvider } from "./musicbrainz";
import { getCoverArtUrl } from "./provenance";
import type { CatalogueAlbumProvider } from "./types";

export type ArtworkEdit =
  | { action: "keep" }
  | { action: "remove" }
  | { action: "replace"; coverUrl: string; artworkData: Json };

export type ArtworkEditValidation =
  { success: true; data: ArtworkEdit } | { success: false; message: string };

const MUSICBRAINZ_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateArtworkEdit(formData: FormData): ArtworkEditValidation {
  const action = String(formData.get("artworkAction") ?? "keep");

  if (action === "keep" || action === "remove") {
    return { success: true, data: { action } };
  }

  if (action !== "replace") {
    return {
      success: false,
      message: "Choose whether to keep, replace, or remove the artwork.",
    };
  }

  const externalId = String(formData.get("catalogueId") ?? "").trim();
  const coverUrl = String(formData.get("catalogueCoverUrl") ?? "").trim();
  const originalUrl = String(
    formData.get("catalogueCoverOriginalUrl") ?? "",
  ).trim();
  const safeCoverUrl = getCoverArtUrl(coverUrl);
  const safeOriginalUrl = getCoverArtUrl(originalUrl);

  if (
    !MUSICBRAINZ_ID_PATTERN.test(externalId) ||
    coverUrl.length > 2048 ||
    originalUrl.length > 2048 ||
    !safeCoverUrl ||
    !safeOriginalUrl
  ) {
    return {
      success: false,
      message:
        "That artwork selection is no longer valid. Find the artwork again or keep the current cover.",
    };
  }

  return {
    success: true,
    data: {
      action: "replace",
      coverUrl: safeCoverUrl,
      artworkData: {
        provider: "musicbrainz",
        entityType: "release_group",
        releaseGroup: { id: externalId.toLowerCase() },
        coverArt: {
          thumbnailUrl: safeCoverUrl,
          originalUrl: safeOriginalUrl,
        },
      },
    },
  };
}

export async function resolveArtworkEdit(
  formData: FormData,
  provider: CatalogueAlbumProvider = musicBrainzCatalogueProvider,
): Promise<ArtworkEditValidation> {
  const validation = validateArtworkEdit(formData);
  if (!validation.success || validation.data.action !== "replace") {
    return validation;
  }

  const externalId = String(formData.get("catalogueId") ?? "").trim();
  const selectedOriginalUrl = getCoverArtUrl(
    String(formData.get("catalogueCoverOriginalUrl") ?? ""),
  );
  const verifiedCover = await provider.getAlbumCover(externalId);
  if (
    verifiedCover.status !== "success" ||
    verifiedCover.coverUrl !== validation.data.coverUrl ||
    verifiedCover.originalUrl !== selectedOriginalUrl
  ) {
    return {
      success: false,
      message:
        "That artwork selection could not be verified. Find the artwork again or keep the current cover.",
    };
  }

  return validation;
}
