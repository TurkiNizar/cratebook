import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReleaseCover } from "./release-cover";

describe("ReleaseCover", () => {
  it("renders trusted catalogue artwork with useful alternative text", () => {
    render(
      <ReleaseCover
        coverUrl="https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500"
        title="Kind of Blue"
        sizes="320px"
        meaningful
      />,
    );

    expect(screen.getByAltText("Kind of Blue cover")).toHaveAttribute(
      "src",
      "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
    );
  });

  it("falls back safely when a cover URL is absent or untrusted", () => {
    const { rerender } = render(
      <ReleaseCover
        coverUrl="https://example.com/untrusted.jpg"
        title="Kind of Blue"
        sizes="320px"
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("K")).toBeVisible();

    rerender(<ReleaseCover title="A Love Supreme" sizes="320px" />);
    expect(screen.getByText("A")).toBeVisible();
  });

  it("accepts representative release-group artwork", () => {
    render(
      <ReleaseCover
        coverUrl="https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500"
        title="Journey in Satchidananda"
        sizes="280px"
        meaningful
      />,
    );

    expect(screen.getByAltText("Journey in Satchidananda cover")).toBeVisible();
  });
});
