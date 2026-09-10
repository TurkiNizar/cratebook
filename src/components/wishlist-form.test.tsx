import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WishlistForm, type WishlistFormValues } from "./wishlist-form";

const values: WishlistFormValues = {
  artist: "Alice Coltrane",
  title: "Journey in Satchidananda",
  priority: "must_have",
  preferredEdition: "Impulse stereo pressing",
  maxPrice: "75.00",
  priceCurrency: "USD",
  notes: "Check the sleeve.",
  isPublic: true,
};

describe("WishlistForm", () => {
  it("preloads wishlist preferences and exposes safe visibility guidance", () => {
    render(
      <WishlistForm
        action={async () => ({ message: "", fieldErrors: {} })}
        cancelHref="/wishlist/item-id"
        initialValues={values}
        variant="edit"
      />,
    );

    expect(screen.getByLabelText("Artist")).toHaveValue("Alice Coltrane");
    expect(screen.getByLabelText("Priority")).toHaveValue("must_have");
    expect(screen.getByLabelText("Maximum price")).toHaveValue("75.00");
    expect(screen.getByLabelText("Currency")).toHaveValue("USD");
    expect(screen.getByRole("checkbox", { name: /Visible/ })).toBeChecked();
    expect(
      screen.getByText(/maximum price and private notes are never shared/i),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/wishlist/item-id",
    );
  });
});
