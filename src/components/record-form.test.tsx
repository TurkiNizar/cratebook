import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});
