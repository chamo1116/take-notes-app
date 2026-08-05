import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SignupLoading from "./loading";

describe("SignupLoading", () => {
  it("renders a loading spinner", () => {
    render(<SignupLoading />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
