import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginLoading from "./loading";

describe("LoginLoading", () => {
  it("renders a loading spinner", () => {
    render(<LoginLoading />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
