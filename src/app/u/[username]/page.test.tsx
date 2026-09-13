import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient }));

import PublicProfilePage from "./page";

describe("PublicProfilePage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createClient.mockResolvedValue({ rpc });
    rpc.mockImplementation((name: string) => {
      if (name === "get_public_profile") {
        return Promise.resolve({
          data: [
            {
              username: "local_collector",
              display_name: "Local Collector",
              bio: "Jazz discoveries and records with a story.",
              is_public: true,
              is_owner: false,
              collection_count: 1,
              wishlist_count: 1,
            },
          ],
          error: null,
        });
      }
      if (name === "get_public_collection_items") {
        return Promise.resolve({
          data: [
            {
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              artist_display: "Nina Simone",
              title: "Pastel Blues",
              cover_url: null,
              format: "lp",
              disc_count: 1,
              original_year: 1965,
              release_year: null,
              label: "Philips",
              catalog_number: null,
              country: "US",
              is_favorite: true,
              created_at: "2026-09-13T12:00:00Z",
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({
        data: [
          {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            artist_display: "Alice Coltrane",
            title: "Journey in Satchidananda",
            cover_url: null,
            priority: "must_have",
            preferred_edition: "Any clean Impulse pressing",
            created_at: "2026-09-13T11:00:00Z",
          },
        ],
        error: null,
      });
    });
  });

  it("renders the visible collection and wishlist without private fields", async () => {
    render(
      await PublicProfilePage({
        params: Promise.resolve({ username: "local_collector" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Local Collector", level: 1 }),
    ).toBeVisible();
    expect(screen.getByText("@local_collector")).toBeVisible();
    expect(
      screen.getByText("Jazz discoveries and records with a story."),
    ).toBeVisible();

    const collection = screen.getByRole("list", {
      name: "Local Collector's shared collection",
    });
    const wishlist = screen.getByRole("list", {
      name: "Local Collector's shared wishlist",
    });
    expect(
      within(collection).getByRole("article", { name: "Pastel Blues" }),
    ).toBeVisible();
    expect(
      within(wishlist).getByRole("article", {
        name: "Journey in Satchidananda",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/price paid/i)).toBeNull();
    expect(screen.queryByText(/private note/i)).toBeNull();
    expect(screen.queryByText(/acquired from/i)).toBeNull();
  });

  it("explains when a public profile has not shared any items", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "get_public_profile"
            ? [
                {
                  username: "quiet_crate",
                  display_name: null,
                  bio: null,
                  is_public: true,
                  is_owner: false,
                  collection_count: 0,
                  wishlist_count: 0,
                },
              ]
            : [],
        error: null,
      }),
    );

    render(
      await PublicProfilePage({
        params: Promise.resolve({ username: "quiet_crate" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "No records shared yet" }),
    ).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("labels an owner-only private preview and does not offer its unavailable link", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "get_public_profile"
            ? [
                {
                  username: "local_collector",
                  display_name: "Local Collector",
                  bio: null,
                  is_public: false,
                  is_owner: true,
                  collection_count: 0,
                  wishlist_count: 0,
                },
              ]
            : [],
        error: null,
      }),
    );

    render(
      await PublicProfilePage({
        params: Promise.resolve({ username: "local_collector" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Only you can see this preview" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Manage sharing" }),
    ).toHaveAttribute("href", "/settings");
    expect(
      screen.queryByRole("button", { name: "Copy profile link" }),
    ).toBeNull();
  });

  it("labels the owner's live view and offers its share link", async () => {
    rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "get_public_profile"
            ? [
                {
                  username: "local_collector",
                  display_name: "Local Collector",
                  bio: null,
                  is_public: true,
                  is_owner: true,
                  collection_count: 0,
                  wishlist_count: 0,
                },
              ]
            : [],
        error: null,
      }),
    );

    render(
      await PublicProfilePage({
        params: Promise.resolve({ username: "local_collector" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "This is what visitors can see" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy profile link" }),
    ).toBeVisible();
  });
});
