import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BottomNavigation } from "./bottom-navigation";

const mocks = vi.hoisted(() => ({ pathname: "/collection" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

describe("BottomNavigation", () => {
  beforeEach(() => {
    mocks.pathname = "/collection";
  });

  it("renders four labelled destinations with Add in the regular tab order", () => {
    render(<BottomNavigation />);

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const links = navigation.querySelectorAll("a");

    expect(links).toHaveLength(4);
    expect(Array.from(links, (link) => link.textContent)).toEqual([
      "Collection",
      "Wishlist",
      "Add",
      "Profile",
    ]);
    expect(screen.getByRole("link", { name: "Add" })).toHaveAttribute(
      "href",
      "/add",
    );
  });

  it.each([
    ["/collection/record-id/edit", "Collection"],
    ["/wishlist/wish-id", "Wishlist"],
    ["/add/catalogue/album-id/editions", "Add"],
    ["/settings", "Profile"],
  ])("marks %s as the current %s destination", (pathname, label) => {
    mocks.pathname = pathname;
    render(<BottomNavigation />);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getAllByRole("link").filter((link) => link.ariaCurrent),
    ).toHaveLength(1);
  });
});
