import "server-only";

import type { Json } from "@/types/database";

import { musicBrainzCatalogueProvider } from "./musicbrainz";
import { getCoverArtSelectionForRelease } from "./provenance";
import type {
  CatalogueCoverResult,
  CatalogueCoverSelection,
  CatalogueProvider,
  CatalogueReleaseCandidate,
} from "./types";

export type CatalogueReleasePersistence = CatalogueReleaseCandidate & {
  coverUrl: string | null;
  sourceData: Json;
};

export type CatalogueSelectionResult =
  | { status: "success"; release: CatalogueReleasePersistence }
  | { status: "unavailable" };

type ResolveCatalogueSelectionOptions = {
  provider?: CatalogueProvider;
  selectedCover?: CatalogueCoverSelection;
};

function validateSelectedCover(
  externalId: string,
  selectedCover: CatalogueCoverSelection | undefined,
): CatalogueCoverResult | null {
  if (!selectedCover) {
    return null;
  }

  const cover = getCoverArtSelectionForRelease(
    selectedCover.coverUrl,
    selectedCover.originalUrl,
    externalId,
  );
  return cover ? { status: "success", ...cover } : null;
}

function provenanceWithCover(
  candidate: CatalogueReleaseCandidate,
  cover: Awaited<ReturnType<CatalogueProvider["getCover"]>>,
): Json {
  const snapshot =
    typeof candidate.sourceData === "object" &&
    candidate.sourceData !== null &&
    !Array.isArray(candidate.sourceData)
      ? candidate.sourceData
      : { release: candidate.sourceData };

  return {
    ...snapshot,
    provider: candidate.source,
    entityType: candidate.entityType,
    coverArt:
      cover.status === "success"
        ? {
            thumbnailUrl: cover.coverUrl,
            originalUrl: cover.originalUrl,
          }
        : null,
  };
}

export async function resolveCatalogueSelection(
  externalId: string,
  options: ResolveCatalogueSelectionOptions = {},
): Promise<CatalogueSelectionResult> {
  const provider = options.provider ?? musicBrainzCatalogueProvider;
  const selectedCover = validateSelectedCover(
    externalId,
    options.selectedCover,
  );
  const [lookup, cover] = await Promise.all([
    provider.lookup(externalId),
    selectedCover ?? provider.getCover(externalId),
  ]);

  if (
    lookup.status !== "success" ||
    lookup.candidate.externalId.toLocaleLowerCase("en") !==
      externalId.toLocaleLowerCase("en")
  ) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    release: {
      ...lookup.candidate,
      coverUrl: cover.status === "success" ? cover.coverUrl : null,
      sourceData: provenanceWithCover(lookup.candidate, cover),
    },
  };
}
