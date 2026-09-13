import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CollectionLoading from "@/app/(app)/collection/loading";
import WishlistLoading from "@/app/(app)/wishlist/loading";
import PublicProfileLoading from "@/app/u/[username]/loading";

describe.each([
  ["collection", CollectionLoading, "Opening your crate…"],
  ["wishlist", WishlistLoading, "Opening your want list…"],
  ["public profile", PublicProfileLoading, "Opening this crate…"],
])("%s record-list loading state", (_, LoadingComponent, loadingMessage) => {
  it("announces progress while keeping decorative skeletons hidden", () => {
    const { container } = render(<LoadingComponent />);
    const busyContainer = container.querySelector('[aria-busy="true"]');
    const skeletonGrid = container.querySelector(".collection-grid");

    expect(busyContainer).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(loadingMessage)).toBeVisible();
    expect(skeletonGrid).toHaveAttribute("aria-hidden", "true");
    expect(skeletonGrid).not.toHaveAttribute("aria-label");
    expect(
      skeletonGrid?.querySelectorAll(".collection-card-skeleton"),
    ).toHaveLength(4);
  });
});
