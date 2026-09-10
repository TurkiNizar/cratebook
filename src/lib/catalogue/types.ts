import type { Enums, Json } from "@/types/database";

export type CatalogueSource = "musicbrainz";

export type CatalogueReleaseCandidate = {
  source: CatalogueSource;
  externalId: string;
  sourceUrl: string;
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

export type CatalogueSearchResult =
  | { status: "success"; candidates: CatalogueReleaseCandidate[] }
  | { status: "no_results" }
  | { status: "invalid_query"; message: string }
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

export interface CatalogueProvider {
  readonly source: CatalogueSource;
  search(query: string): Promise<CatalogueSearchResult>;
  getCover(externalId: string): Promise<CatalogueCoverResult>;
}
