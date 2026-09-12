import type { Enums, Json } from "@/types/database";

export type CatalogueSource = "musicbrainz";
export type CatalogueEntityType = "release" | "release_group";

export type CatalogueIdentity = {
  source: CatalogueSource;
  entityType: CatalogueEntityType;
  externalId: string;
  sourceUrl: string;
};

export type CatalogueReleaseCandidate = CatalogueIdentity & {
  entityType: "release";
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
  barcode: string | null;
  sourceData: Json;
};

export type CatalogueAlbumCandidate = CatalogueIdentity & {
  entityType: "release_group";
  artist: string;
  title: string;
  originalYear: number | null;
  representativeCoverUrl: string;
  sourceData: Json;
};

export type CatalogueAlbumSearchOptions = {
  page?: number;
  pageSize?: number;
};

export type CatalogueEditionSearchOptions = CatalogueAlbumSearchOptions;

export type CatalogueAlbumSearchResult =
  | {
      status: "success";
      candidates: CatalogueAlbumCandidate[];
      pagination: {
        page: number;
        pageSize: number;
        totalResults: number;
        hasNextPage: boolean;
      };
    }
  | { status: "no_results" }
  | { status: "invalid_query"; message: string }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueAlbumLookupResult =
  | { status: "success"; candidate: CatalogueAlbumCandidate }
  | { status: "not_found" }
  | { status: "invalid_id" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueEditionSearchResult =
  | {
      status: "success";
      candidates: CatalogueReleaseCandidate[];
      pagination: {
        page: number;
        pageSize: number;
        totalResults: number;
        hasNextPage: boolean;
      };
    }
  | { status: "no_results" }
  | { status: "invalid_id" }
  | { status: "invalid_request"; message: string }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueSearchResult =
  | { status: "success"; candidates: CatalogueReleaseCandidate[] }
  | { status: "no_results" }
  | { status: "invalid_query"; message: string }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueLookupResult =
  | { status: "success"; candidate: CatalogueReleaseCandidate }
  | { status: "not_found" }
  | { status: "invalid_id" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueCoverResult =
  | {
      status: "success";
      coverUrl: string;
      originalUrl: string;
    }
  | { status: "no_art" }
  | { status: "invalid_id" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "unavailable" }
  | { status: "malformed_response" };

export type CatalogueCoverSelection = {
  coverUrl: string;
  originalUrl: string;
};

export type CatalogueArtworkSuggestion = CatalogueCoverSelection & {
  externalId: string;
  artist: string;
  title: string;
  originalYear: number | null;
  sourceUrl: string;
};

export type CatalogueArtworkSearchState = {
  status:
    | "idle"
    | "success"
    | "invalid_query"
    | "no_results"
    | "no_art"
    | "unavailable";
  message: string;
  suggestions: CatalogueArtworkSuggestion[];
};

export interface CatalogueProvider {
  readonly source: CatalogueSource;
  search(query: string): Promise<CatalogueSearchResult>;
  lookup(externalId: string): Promise<CatalogueLookupResult>;
  getCover(externalId: string): Promise<CatalogueCoverResult>;
}

export interface CatalogueAlbumProvider {
  readonly source: CatalogueSource;
  searchAlbums(
    query: string,
    options?: CatalogueAlbumSearchOptions,
  ): Promise<CatalogueAlbumSearchResult>;
  lookupAlbum(externalId: string): Promise<CatalogueAlbumLookupResult>;
  getAlbumCover(externalId: string): Promise<CatalogueCoverResult>;
}

export interface CatalogueEditionProvider {
  searchAlbumEditions(
    albumExternalId: string,
    options?: CatalogueEditionSearchOptions,
  ): Promise<CatalogueEditionSearchResult>;
}
