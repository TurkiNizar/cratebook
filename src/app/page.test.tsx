import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/components/install-app", () => ({ InstallApp: () => null }));

import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({ auth: { getUser: mocks.getUser } });
    mocks.getUser.mockResolvedValue({ data: { user: null } });
  });

  it("sends signed-out visitors to sign in", async () => {
    render(await HomePage());

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(
      screen.getByRole("link", { name: /build your collection/i }),
    ).toHaveAttribute("href", "/sign-in");
  });

  it("opens the collection for visitors with a valid session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(await HomePage());

    expect(screen.getByRole("link", { name: "My collection" })).toHaveAttribute(
      "href",
      "/collection",
    );
    for (const link of screen.getAllByRole("link", {
      name: /open my collection/i,
    })) {
      expect(link).toHaveAttribute("href", "/collection");
    }
  });
});
