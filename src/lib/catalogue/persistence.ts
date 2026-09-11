import "server-only";

import type { Json } from "@/types/database";

import { musicBrainzCatalogueProvider } from "./musicbrainz";
import type { CatalogueProvider, CatalogueReleaseCandidate } from "./types";

export type CatalogueReleasePersistence = CatalogueReleaseCandidate & {
  coverUrl: string | null;
  sourceData: Json;
};

export type CatalogueSelectionResult =
  | { status: "success"; release: CatalogueReleasePersistence }
  | { status: "unavailable" };

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
  provider: CatalogueProvider = musicBrainzCatalogueProvider,
): Promise<CatalogueSelectionResult> {
  const [lookup, cover] = await Promise.all([
    provider.lookup(externalId),
    provider.getCover(externalId),
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
