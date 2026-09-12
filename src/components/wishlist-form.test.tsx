import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
  it("offers optional representative artwork on manual wishlist entry", async () => {
    const user = userEvent.setup();
    const artworkFinderAction = vi.fn(async () => ({
      status: "no_results" as const,
      message:
        "No matching albums were found. You can keep this record without a cover.",
      suggestions: [],
    }));
    render(
      <WishlistForm
        action={async () => ({ message: "", fieldErrors: {} })}
        artworkFinderAction={artworkFinderAction}
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        variant="create"
      />,
    );

    await user.type(screen.getByLabelText("Artist"), "Unknown Artist");
    await user.type(screen.getByLabelText("Album or release title"), "Unknown");
    await user.click(
      screen.getByRole("button", { name: "Find album artwork" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No matching albums were found",
    );
    expect(
      screen.getByRole("button", { name: /Keep no cover/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

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

  it("submits the selected catalogue identifier and its verified cover references", () => {
    const catalogueCover = {
      coverUrl:
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
      originalUrl:
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front",
    };
    const { container } = render(
      <WishlistForm
        action={async () => ({ message: "", fieldErrors: {} })}
        catalogueCover={catalogueCover}
        catalogueId="11111111-1111-4111-8111-111111111111"
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        initialValues={values}
        variant="create"
      />,
    );

    expect(container.querySelector('input[name="catalogueId"]')).toHaveValue(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(
      container.querySelector('input[name="catalogueEntityType"]'),
    ).toHaveValue("release");
    expect(
      container.querySelector('input[name="catalogueCoverUrl"]'),
    ).toHaveValue(catalogueCover.coverUrl);
    expect(
      container.querySelector('input[name="catalogueCoverOriginalUrl"]'),
    ).toHaveValue(catalogueCover.originalUrl);
    expect(container.querySelector('input[name="sourceData"]')).toBeNull();
  });
});
