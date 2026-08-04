import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteCard } from "./NoteCard";
import type { Note } from "@/lib/types";

const baseNote: Note = {
  id: 1,
  title: "Grocery List",
  body: "Milk, eggs, bread",
  category: "school",
  updatedAt: new Date().toISOString(),
};

describe("NoteCard", () => {
  it("renders the title, body, and date label", () => {
    render(<NoteCard note={baseNote} onClick={vi.fn()} />);

    expect(screen.getByText("Grocery List")).toBeInTheDocument();
    expect(screen.getByText("Milk, eggs, bread")).toBeInTheDocument();
    expect(screen.getByTestId("note-card-date")).toHaveTextContent("today");
    expect(screen.getByText("School")).toBeInTheDocument();
  });

  it("colors the card background according to the note's category", () => {
    const { container } = render(
      <NoteCard note={{ ...baseNote, category: "drama" }} onClick={vi.fn()} />,
    );

    const card = container.querySelector('[style*="background-color"]');
    expect(card).toHaveStyle({ backgroundColor: "#C8CFA080" });
  });

  it("calls onClick when the card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<NoteCard note={baseNote} onClick={onClick} />);

    await user.click(screen.getByTestId("note-card"));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
