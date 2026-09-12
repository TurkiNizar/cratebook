import "server-only";

import type { Json } from "@/types/database";

import { musicBrainzCatalogueProvider } from "./musicbrainz";
import { getCoverArtSelectionForEntity } from "./provenance";
import type {
  CatalogueAlbumCandidate,
  CatalogueAlbumProvider,
  CatalogueCoverResult,
  CatalogueCoverSelection,
  CatalogueEntityType,
  CatalogueProvider,
  CatalogueReleaseCandidate,
} from "./types";

export type CatalogueReleasePersistence = CatalogueReleaseCandidate & {
  coverUrl: string | null;
  sourceData: Json;
};

export type CatalogueAlbumPersistence = CatalogueAlbumCandidate & {
  coverUrl: string | null;
  format: null;
  discCount: null;
  releaseYear: null;
  label: null;
  catalogNumber: null;
  country: null;
  editionDescription: null;
  barcode: null;
  sourceData: Json;
};

export type CataloguePersistence =
  CatalogueReleasePersistence | CatalogueAlbumPersistence;

export type CatalogueSelectionResult =
  | { status: "success"; release: CataloguePersistence }
  | { status: "unavailable" };

type ResolveCatalogueSelectionOptions = {
  provider?: CatalogueProvider;
  selectedCover?: CatalogueCoverSelection;
};

type ResolveCatalogueAlbumSelectionOptions = {
  provider?: CatalogueAlbumProvider;
  selectedCover?: CatalogueCoverSelection;
};

function validateSelectedCover(
  externalId: string,
  entityType: CatalogueEntityType,
  selectedCover: CatalogueCoverSelection | undefined,
): CatalogueCoverResult | null {
  if (!selectedCover) {
    return null;
  }

  const cover = getCoverArtSelectionForEntity(
    selectedCover.coverUrl,
    selectedCover.originalUrl,
    entityType,
    externalId,
  );
  return cover ? { status: "success", ...cover } : null;
}

function provenanceWithCover(
  candidate: CatalogueReleaseCandidate | CatalogueAlbumCandidate,
  cover: CatalogueCoverResult,
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
    "release",
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

export async function resolveCatalogueAlbumSelection(
  externalId: string,
  options: ResolveCatalogueAlbumSelectionOptions = {},
): Promise<CatalogueSelectionResult> {
  const provider = options.provider ?? musicBrainzCatalogueProvider;
  const selectedCover = validateSelectedCover(
    externalId,
    "release_group",
    options.selectedCover,
  );
  const [lookup, cover] = await Promise.all([
    provider.lookupAlbum(externalId),
    selectedCover ?? provider.getAlbumCover(externalId),
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
      format: null,
      discCount: null,
      releaseYear: null,
      label: null,
      catalogNumber: null,
      country: null,
      editionDescription: null,
      barcode: null,
      sourceData: provenanceWithCover(lookup.candidate, cover),
    },
  };
}
