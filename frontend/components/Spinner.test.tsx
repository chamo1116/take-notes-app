import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renders an accessible status with the given label", () => {
    render(<Spinner label="Loading more notes" />);

    expect(screen.getByRole("status", { name: "Loading more notes" })).toBeInTheDocument();
  });

  it("applies the large size class when requested", () => {
    render(<Spinner label="Loading" size="lg" />);

    expect(screen.getByRole("status")).toHaveClass("h-10", "w-10");
  });

  it("defaults to the small size class", () => {
    render(<Spinner label="Loading" />);

    expect(screen.getByRole("status")).toHaveClass("h-6", "w-6");
  });
});
