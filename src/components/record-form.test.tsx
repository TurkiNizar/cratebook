import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RecordForm, type RecordFormValues } from "./record-form";

const values: RecordFormValues = {
  artist: "Nina Simone",
  title: "Pastel Blues",
  format: "lp",
  discCount: "1",
  originalYear: "1965",
  releaseYear: "",
  label: "Philips",
  catalogNumber: "PHS 600-187",
  country: "US",
  editionDescription: "",
  vinylColor: "Black",
  barcode: "",
  matrixRunout: "",
  purchaseState: "used",
  mediaCondition: "near_mint",
  sleeveCondition: "very_good_plus",
  acquiredOn: "2026-09-10",
  acquiredFrom: "Local record shop",
  pricePaid: "24.99",
  priceCurrency: "USD",
  rating: "5",
  notes: "A late-night favorite.",
  tags: "Jazz, Sunday morning",
  isReissue: false,
  isFavorite: true,
};

describe("RecordForm", () => {
  it("finds representative album artwork, submits its album provenance, and supports no cover", async () => {
    const user = userEvent.setup();
    const artworkFinderAction = vi.fn(async (_state, formData: FormData) => {
      expect(formData.get("artist")).toBe("Nina Simone");
      expect(formData.get("title")).toBe("Pastel Blues");
      return {
        status: "success" as const,
        message: "Choose artwork.",
        suggestions: [
          {
            externalId: "22222222-2222-4222-8222-222222222222",
            artist: "Nina Simone",
            title: "Pastel Blues",
            originalYear: 1965,
            sourceUrl:
              "https://musicbrainz.org/release-group/22222222-2222-4222-8222-222222222222",
            coverUrl:
              "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500",
            originalUrl:
              "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front",
          },
        ],
      };
    });
    const { container } = render(
      <RecordForm
        action={async () => ({ message: "", fieldErrors: {} })}
        artworkFinderAction={artworkFinderAction}
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        variant="create"
      />,
    );

    await user.type(screen.getByLabelText("Artist"), "Nina Simone");
    await user.type(
      screen.getByLabelText("Album or release title"),
      "Pastel Blues",
    );
    await user.click(
      screen.getByRole("button", { name: "Find album artwork" }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Use artwork for Pastel Blues by Nina Simone",
      }),
    );

    expect(container.querySelector('input[name="catalogueId"]')).toHaveValue(
      "22222222-2222-4222-8222-222222222222",
    );
    expect(
      container.querySelector('input[name="catalogueEntityType"]'),
    ).toHaveValue("release_group");
    expect(screen.getByText(/Artwork from Cover Art Archive/)).toBeVisible();

    await user.type(screen.getByLabelText("Artist"), " Jr.");
    expect(container.querySelector('input[name="catalogueId"]')).toBeNull();
    await user.click(
      screen.getByRole("button", {
        name: "Use artwork for Pastel Blues by Nina Simone",
      }),
    );
    await user.click(screen.getByRole("button", { name: /Keep no cover/ }));
    expect(container.querySelector('input[name="catalogueId"]')).toBeNull();
    expect(
      container.querySelector('input[name="catalogueCoverUrl"]'),
    ).toBeNull();
  });

  it("preloads an existing record and provides edit actions", () => {
    render(
      <RecordForm
        action={async () => ({ message: "", fieldErrors: {} })}
        cancelHref="/collection/item-id"
        initialValues={values}
        variant="edit"
      />,
    );

    expect(screen.getByLabelText("Artist")).toHaveValue("Nina Simone");
    expect(screen.getByLabelText("Album or release title")).toHaveValue(
      "Pastel Blues",
    );
    expect(screen.getByLabelText("Format")).toHaveValue("lp");
    expect(screen.getByLabelText("Original release year")).toHaveValue(1965);
    expect(screen.getByRole("checkbox", { name: /Favorite/ })).toBeChecked();
    expect(screen.getByLabelText("Media condition")).toHaveValue("near_mint");
    expect(screen.getByLabelText("Price paid")).toHaveValue("24.99");
    expect(screen.getByLabelText("Tags")).toHaveValue("Jazz, Sunday morning");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/collection/item-id",
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
      <RecordForm
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

  it("shows a non-blocking duplicate warning and preserves entered values", async () => {
    const user = userEvent.setup();

    render(
      <RecordForm
        action={async () => ({
          message: "",
          fieldErrors: {},
          duplicate: {
            collectionItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            artist: "Nina Simone",
            title: "Pastel Blues",
            copyCount: 2,
            confirmationValue: '["nina simone","pastel blues"]',
          },
        })}
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        variant="create"
      />,
    );

    await user.type(screen.getByLabelText("Artist"), "Nina Simone");
    await user.type(
      screen.getByLabelText("Album or release title"),
      "Pastel Blues",
    );
    await user.click(
      screen.getByRole("button", { name: "Add to my collection" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You already have 2 copies of Pastel Blues by Nina Simone",
    );
    expect(screen.getByLabelText("Artist")).toHaveValue("Nina Simone");
    expect(screen.getByLabelText("Album or release title")).toHaveValue(
      "Pastel Blues",
    );
    expect(
      screen.getByRole("link", { name: "Review an existing copy" }),
    ).toHaveAttribute(
      "href",
      "/collection/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(
      screen.getByRole("button", { name: "Add another copy" }),
    ).toBeVisible();
  });

  it("asks only for copy details when moving a wishlist item", () => {
    render(
      <RecordForm
        action={async () => ({ message: "", fieldErrors: {} })}
        cancelHref="/wishlist/wish-id"
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        initialValues={values}
        variant="convert"
      />,
    );

    expect(screen.queryByLabelText("Artist")).toBeNull();
    expect(screen.queryByLabelText("Format")).toBeNull();
    expect(screen.getByLabelText("Bought as")).toHaveValue("used");
    expect(screen.getByLabelText("Personal notes or story")).toHaveValue(
      "A late-night favorite.",
    );
    expect(
      screen.getByRole("button", { name: "Move to collection" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/wishlist/wish-id",
    );
  });

  it("keeps conversion details while warning about an owned copy", async () => {
    const user = userEvent.setup();

    render(
      <RecordForm
        action={async () => ({
          message: "",
          fieldErrors: {},
          duplicate: {
            collectionItemId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            artist: "Nina Simone",
            title: "Pastel Blues",
            copyCount: 1,
            confirmationValue: '["nina simone","pastel blues"]',
          },
        })}
        cancelHref="/wishlist/wish-id"
        entryKey="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        initialValues={values}
        variant="convert"
      />,
    );

    await user.clear(screen.getByLabelText("Acquired from"));
    await user.type(screen.getByLabelText("Acquired from"), "Record fair");
    await user.click(
      screen.getByRole("button", { name: "Move to collection" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You already have 1 copy of Pastel Blues by Nina Simone",
    );
    expect(screen.getByLabelText("Acquired from")).toHaveValue("Record fair");
    expect(
      screen.getByRole("link", { name: "Review an existing copy" }),
    ).toHaveAttribute(
      "href",
      "/collection/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(
      screen.getByRole("button", { name: "Move to collection" }),
    ).toBeVisible();
  });
});
