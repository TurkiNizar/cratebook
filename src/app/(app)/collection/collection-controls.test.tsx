import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CollectionControls as CollectionControlsValue } from "@/lib/collection";

import { CollectionControls } from "./collection-controls";

const controls: CollectionControlsValue = {
  query: "jazz",
  favorite: true,
  purchaseState: "used",
  format: "lp",
  condition: "near_mint",
  sort: "artist",
  isActive: true,
};

describe("CollectionControls", () => {
  it("preserves active controls in an accessible GET form", () => {
    render(<CollectionControls controls={controls} />);

    const search = screen.getByRole("search");
    expect(search).toHaveAttribute("action", "/collection");
    expect(within(search).getByLabelText("Search your collection")).toHaveValue(
      "jazz",
    );
    expect(within(search).getByLabelText("Bought as")).toHaveValue("used");
    expect(within(search).getByLabelText("Format")).toHaveValue("lp");
    expect(within(search).getByLabelText("Condition")).toHaveValue("near_mint");
    expect(within(search).getByLabelText("Sort by")).toHaveValue("artist");
    expect(
      within(search).getByRole("checkbox", { name: /Favorites only/ }),
    ).toBeChecked();
    expect(within(search).getByRole("link", { name: "Clear" })).toHaveAttribute(
      "href",
      "/collection",
    );
  });

  it("keeps optional filters collapsed when inactive", () => {
    render(
      <CollectionControls
        controls={{
          ...controls,
          query: "",
          favorite: false,
          purchaseState: "",
          format: "",
          condition: "",
          sort: "newest",
          isActive: false,
        }}
      />,
    );

    expect(
      screen.getByText("Filters and sorting").closest("details"),
    ).not.toHaveAttribute("open");
    expect(screen.queryByRole("link", { name: "Clear" })).toBeNull();
  });
});
