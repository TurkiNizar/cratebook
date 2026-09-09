import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "./brand-mark";

describe("BrandMark", () => {
  it("exposes the product name", () => {
    render(<BrandMark />);
    expect(screen.getByLabelText("Cratebook")).toBeInTheDocument();
  });
});
