import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupError from "./error";

describe("SignupError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a message and logs the error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    render(<SignupError error={error} reset={vi.fn()} />);

    expect(screen.getByText("Something went wrong loading this page.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Signup page render error", error);
  });

  it("calls reset when Try again is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<SignupError error={new Error("boom")} reset={reset} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
