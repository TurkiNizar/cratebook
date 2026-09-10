import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WishlistCard, type WishlistCardItem } from "./wishlist-card";

const item: WishlistCardItem = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  priority: "must_have",
  preferredEdition: "Impulse stereo pressing",
  maxPriceMinor: 7500,
  priceCurrency: "USD",
  isPublic: true,
  release: {
    artist_display: "Alice Coltrane",
    title: "Journey in Satchidananda",
  },
};

describe("WishlistCard", () => {
  it("shows identity, priority, preferences, price, and visibility", () => {
    render(<WishlistCard item={item} />);
    const card = screen.getByRole("article", { name: item.release.title });

    expect(within(card).getByRole("link")).toHaveAttribute(
      "href",
      `/wishlist/${item.id}`,
    );
    expect(within(card).getByText("Alice Coltrane")).toBeVisible();
    expect(within(card).getByText("Must-have")).toBeVisible();
    expect(within(card).getByText("Impulse stereo pressing")).toBeVisible();
    expect(within(card).getByText("Up to $75.00")).toBeVisible();
    expect(within(card).getByText("Visible")).toBeVisible();
  });
});
