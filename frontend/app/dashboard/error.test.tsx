import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardError from "./error";

describe("DashboardError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a message and logs the error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<DashboardError error={error} reset={vi.fn()} />);

    expect(screen.getByText("Something went wrong loading your notes.")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith("Dashboard render error", error);
  });

  it("calls reset when Try again is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<DashboardError error={new Error("boom")} reset={reset} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
