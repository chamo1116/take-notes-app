import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLoading from "./loading";

describe("DashboardLoading", () => {
  it("renders a loading spinner", () => {
    render(<DashboardLoading />);

    expect(screen.getByRole("status", { name: "Loading your notes" })).toBeInTheDocument();
  });
});
