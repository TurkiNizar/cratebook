import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { searchAlbums } = vi.hoisted(() => ({ searchAlbums: vi.fn() }));

vi.mock("@/lib/catalogue/musicbrainz", () => ({
  musicBrainzCatalogueProvider: { searchAlbums },
}));

import CatalogueSearchPage from "./page";

describe("CatalogueSearchPage", () => {
  it("uses album discovery as the default search and passes pagination", async () => {
    searchAlbums.mockResolvedValue({ status: "no_results" });

    render(
      await CatalogueSearchPage({
        searchParams: Promise.resolve({
          q: "  Kind   of Blue ",
          page: "3",
        }),
      }),
    );

    expect(searchAlbums).toHaveBeenCalledWith("Kind of Blue", { page: 3 });
    expect(
      screen.getByRole("heading", { name: "Find an album" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Nothing found for “Kind of Blue”" }),
    ).toBeVisible();
  });

  it("normalizes an invalid page to the first page", async () => {
    searchAlbums.mockResolvedValue({ status: "no_results" });

    render(
      await CatalogueSearchPage({
        searchParams: Promise.resolve({ q: "Blue Train", page: "not-a-page" }),
      }),
    );

    expect(searchAlbums).toHaveBeenLastCalledWith("Blue Train", { page: 1 });
  });
});
