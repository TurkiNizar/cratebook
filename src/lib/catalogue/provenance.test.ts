import { describe, expect, it } from "vitest";

import {
  getCatalogueAttribution,
  getCoverArtSelectionForRelease,
  getCoverArtUrl,
  getCoverArtUrlForRelease,
} from "./provenance";

describe("catalogue attribution", () => {
  it("builds only a validated MusicBrainz release link", () => {
    expect(
      getCatalogueAttribution(
        "musicbrainz",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toEqual({
      label: "MusicBrainz",
      url: "https://musicbrainz.org/release/11111111-1111-4111-8111-111111111111",
    });
    expect(getCatalogueAttribution("musicbrainz", "../unsafe")).toBeNull();
    expect(
      getCatalogueAttribution(
        "unknown",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBeNull();
  });

  it("accepts only Cover Art Archive release images", () => {
    expect(
      getCoverArtUrl(
        "http://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
      ),
    ).toBeNull();
    expect(
      getCoverArtUrl(
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
      ),
    ).toBe(
      "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
    );
    expect(getCoverArtUrl("https://example.com/cover.jpg")).toBeNull();
  });

  it("matches carried artwork to the selected release", () => {
    expect(
      getCoverArtUrlForRelease(
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(
      "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
    );
    expect(
      getCoverArtUrlForRelease(
        "https://coverartarchive.org/release/22222222-2222-4222-8222-222222222222/front-500",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBeNull();

    expect(
      getCoverArtSelectionForRelease(
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toEqual({
      coverUrl:
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
      originalUrl:
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front",
    });
  });
});
