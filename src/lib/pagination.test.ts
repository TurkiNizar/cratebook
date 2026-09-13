import { describe, expect, it } from "vitest";

import {
  getPageHref,
  getPageRange,
  parsePageParam,
  RECORDS_PAGE_SIZE,
  takePage,
} from "./pagination";

describe("record pagination", () => {
  it("accepts only bounded positive integer pages", () => {
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam(["3", "4"])).toBe(3);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
    expect(parsePageParam("hello")).toBe(1);
    expect(parsePageParam("999999")).toBe(10_000);
  });

  it("requests one extra row and removes it from the rendered page", () => {
    expect(getPageRange(2)).toEqual({
      from: RECORDS_PAGE_SIZE,
      to: RECORDS_PAGE_SIZE * 2,
    });

    const result = takePage(
      Array.from({ length: RECORDS_PAGE_SIZE + 1 }, (_, index) => index),
    );
    expect(result.items).toHaveLength(RECORDS_PAGE_SIZE);
    expect(result.hasNextPage).toBe(true);
  });

  it("preserves filters and parallel page state in page links", () => {
    expect(
      getPageHref(
        "/collection",
        { q: "blue note", favorite: "1", page: "2", removed: "1" },
        "page",
        3,
      ),
    ).toBe("/collection?q=blue+note&favorite=1&page=3");
    expect(
      getPageHref(
        "/u/listener",
        { collectionPage: "2", wishlistPage: "4" },
        "collectionPage",
        1,
      ),
    ).toBe("/u/listener?wishlistPage=4");
  });
});
