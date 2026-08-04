import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryDropdown } from "./CategoryDropdown";
import { CATEGORIES } from "@/lib/categories";

describe("CategoryDropdown", () => {
  it("shows the selected category and hides it from the option list", async () => {
    const user = userEvent.setup();
    render(
      <CategoryDropdown categories={CATEGORIES} selected={CATEGORIES[0]} onSelect={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /Random Thoughts/ })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Random Thoughts/ }));

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Personal" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Random Thoughts" })).not.toBeInTheDocument();
  });

  it("calls onSelect with the chosen category's slug and closes the list", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoryDropdown categories={CATEGORIES} selected={CATEGORIES[0]} onSelect={onSelect} />,
    );

    await user.click(screen.getByRole("button", { name: /Random Thoughts/ }));
    await user.click(screen.getByRole("option", { name: "Drama" }));

    expect(onSelect).toHaveBeenCalledWith("drama");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the list when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <CategoryDropdown categories={CATEGORIES} selected={CATEGORIES[0]} onSelect={vi.fn()} />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /Random Thoughts/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes the list on Escape", async () => {
    const user = userEvent.setup();
    render(
      <CategoryDropdown categories={CATEGORIES} selected={CATEGORIES[0]} onSelect={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: /Random Thoughts/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
