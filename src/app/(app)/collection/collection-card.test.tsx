import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CollectionCard, type CollectionCardItem } from "./collection-card";

const item: CollectionCardItem = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  isFavorite: true,
  release: {
    artist_display: "Nina Simone",
    title: "Pastel Blues",
    format: "lp",
    disc_count: 1,
    original_year: 1965,
    release_year: null,
    label: "Philips",
    catalog_number: "PHS 600-187",
    country: "US",
  },
};

describe("CollectionCard", () => {
  it("shows the release identity and useful edition details", () => {
    render(<CollectionCard item={item} />);

    const card = screen.getByRole("article", { name: "Pastel Blues" });
    expect(within(card).getByRole("link")).toHaveAttribute(
      "href",
      `/collection/${item.id}`,
    );
    expect(within(card).getByText("Nina Simone")).toBeVisible();
    expect(within(card).getByText("LP")).toBeVisible();
    expect(within(card).getByText("1965")).toBeVisible();
    expect(within(card).getByText("US")).toBeVisible();
    expect(within(card).getByText("Philips · PHS 600-187")).toBeVisible();
    expect(within(card).getByLabelText("Favorite")).toBeVisible();
  });

  it("keeps sparse manual records clear without empty metadata", () => {
    render(
      <CollectionCard
        item={{
          ...item,
          release: {
            ...item.release,
            format: null,
            original_year: null,
            label: null,
            catalog_number: null,
            country: null,
          },
        }}
      />,
    );

    expect(screen.getByRole("article", { name: "Pastel Blues" })).toBeVisible();
    expect(screen.queryByRole("list", { name: "Release details" })).toBeNull();
  });
});
