import { fireEvent, render, screen } from "@testing-library/react";
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

    const cover = screen.getByAltText("Kind of Blue cover");

    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover).toHaveAttribute("sizes", "320px");
    expect(cover.getAttribute("src")).toContain("/_next/image?url=");
    expect(cover.getAttribute("src")).toContain(
      encodeURIComponent(
        "https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500",
      ),
    );
    expect(cover.getAttribute("srcset")).toContain("/_next/image?url=");
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

    const cover = screen.getByAltText("Journey in Satchidananda cover");

    expect(cover).toBeVisible();
    expect(cover.getAttribute("src")).toContain(
      encodeURIComponent(
        "https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500",
      ),
    );
  });

  it("preloads only artwork explicitly marked as above the fold", () => {
    render(
      <ReleaseCover
        coverUrl="https://coverartarchive.org/release/11111111-1111-4111-8111-111111111111/front-500"
        title="Kind of Blue"
        sizes="320px"
        meaningful
        preload
      />,
    );

    const cover = screen.getByAltText("Kind of Blue cover");
    expect(cover).not.toHaveAttribute("loading");
    expect(
      document.head.querySelector('link[rel="preload"][as="image"]'),
    ).toBeInTheDocument();
  });

  it("replaces missing remote artwork with an accessible placeholder", () => {
    render(
      <ReleaseCover
        coverUrl="https://coverartarchive.org/release-group/22222222-2222-4222-8222-222222222222/front-500"
        title="Journey in Satchidananda"
        sizes="280px"
        meaningful
      />,
    );

    fireEvent.error(screen.getByAltText("Journey in Satchidananda cover"));

    expect(
      screen.getByRole("img", {
        name: "Journey in Satchidananda cover not available",
      }),
    ).toBeVisible();
    expect(screen.queryByAltText("Journey in Satchidananda cover")).toBeNull();
  });
});
