import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  PublicCollectionCard,
  PublicWishlistCard,
  type PublicCollectionItem,
  type PublicWishlistItem,
} from "./public-record-card";

const collectionItem: PublicCollectionItem = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  artist_display: "Nina Simone",
  title: "Pastel Blues",
  cover_url: null,
  format: "lp",
  disc_count: 1,
  original_year: 1965,
  release_year: null,
  label: "Philips",
  catalog_number: "PHS 600-187",
  country: "US",
  is_favorite: true,
};

const wishlistItem: PublicWishlistItem = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  artist_display: "Alice Coltrane",
  title: "Journey in Satchidananda",
  cover_url: null,
  priority: "must_have",
  preferred_edition: "Any clean Impulse pressing",
};

describe("public record cards", () => {
  it("shows safe collection metadata without linking to the private detail route", () => {
    render(<PublicCollectionCard item={collectionItem} />);

    const card = screen.getByRole("article", { name: "Pastel Blues" });
    expect(within(card).queryByRole("link")).toBeNull();
    expect(within(card).getByText("Nina Simone")).toBeVisible();
    expect(within(card).getByText("LP")).toBeVisible();
    expect(within(card).getByText("1965")).toBeVisible();
    expect(within(card).getByText("Philips · PHS 600-187")).toBeVisible();
    expect(within(card).getByLabelText("Favorite")).toBeVisible();
  });

  it("shows public wishlist preferences without a target price or private route", () => {
    render(<PublicWishlistCard item={wishlistItem} />);

    const card = screen.getByRole("article", {
      name: "Journey in Satchidananda",
    });
    expect(within(card).queryByRole("link")).toBeNull();
    expect(within(card).getByText("Alice Coltrane")).toBeVisible();
    expect(within(card).getByText("Must-have")).toBeVisible();
    expect(within(card).getByText("Any clean Impulse pressing")).toBeVisible();
    expect(within(card).queryByText(/Up to/)).toBeNull();
  });
});
