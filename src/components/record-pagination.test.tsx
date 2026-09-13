import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecordPagination } from "./record-pagination";

describe("RecordPagination", () => {
  it("stays out of the page when all records fit", () => {
    const { container } = render(
      <RecordPagination
        page={1}
        hasNextPage={false}
        previousHref="/records"
        nextHref="/records?page=2"
        label="Record pages"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes previous and next pages with an accessible label", () => {
    render(
      <RecordPagination
        page={2}
        hasNextPage
        previousHref="/records"
        nextHref="/records?page=3"
        label="Record pages"
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Record pages" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute(
      "href",
      "/records",
    );
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/records?page=3",
    );
  });
});
