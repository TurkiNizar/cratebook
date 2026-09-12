import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CatalogueSearchLoading from "./loading";

describe("CatalogueSearchLoading", () => {
  it("uses a neutral, non-interactive skeleton that matches the catalogue layout", () => {
    const { container } = render(<CatalogueSearchLoading />);
    const loading = screen.getByTestId("catalogue-search-loading");

    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading).toHaveAttribute(
      "aria-describedby",
      "catalogue-loading-status",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Opening catalogue search…",
    );
    expect(
      container.querySelector(".catalogue-loading-header"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      container.querySelector(".catalogue-search-form-loading"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".catalogue-album-card")).toHaveLength(3);
    expect(
      container.querySelectorAll(".catalogue-cover-skeleton"),
    ).toHaveLength(3);
    expect(
      container.querySelector(".collection-cover"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("a, button, input")).not.toBeInTheDocument();
  });
});
