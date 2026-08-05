import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesDashboard } from "./NotesDashboard";
import type { Note } from "@/lib/types";
import { getNotesAction } from "./actions";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./actions", () => ({
  createNoteAction: vi.fn(),
  updateNoteAction: vi.fn(),
  deleteNoteAction: vi.fn(),
  getNotesAction: vi.fn(),
}));

const mockedGetNotesAction = vi.mocked(getNotesAction);

const zeroCounts = { random_thoughts: 0, personal: 0, school: 0, drama: 0 };

function note(overrides: Partial<Note>): Note {
  return {
    id: 1,
    title: "Untitled",
    body: "",
    category: "random_thoughts",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("NotesDashboard", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockedGetNotesAction.mockReset();
  });

  it("lists all four categories with their dots and counts", () => {
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    for (const name of ["Random Thoughts", "Personal", "School", "Drama"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("shows the empty state when there are no notes", () => {
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    expect(screen.getByText(/waiting for your charming notes/)).toBeInTheDocument();
  });

  it("renders a card per note with its category count in the sidebar", () => {
    const notes = [
      note({ id: 1, title: "Grocery List", category: "random_thoughts" }),
      note({ id: 2, title: "Meeting Notes", category: "school" }),
    ];
    render(
      <NotesDashboard
        notes={notes}
        nextPage={null}
        counts={{ ...zeroCounts, random_thoughts: 1, school: 1 }}
      />,
    );

    expect(screen.getAllByTestId("note-card")).toHaveLength(2);
    expect(screen.getByText("Grocery List")).toBeInTheDocument();
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
  });

  it("opens the note editor when New Note is clicked, and closes it again", async () => {
    const user = userEvent.setup();
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    expect(screen.queryByTestId("note-title-input")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Note/ }));
    expect(screen.getByTestId("note-title-input")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close note editor" }));
    expect(screen.queryByTestId("note-title-input")).not.toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("resyncs the grid when the server hands it a fresh notes prop (post router.refresh)", () => {
    const { rerender } = render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);
    expect(screen.getByText(/waiting for your charming notes/)).toBeInTheDocument();

    const freshNotes = [note({ id: 9, title: "Just Saved" })];
    rerender(<NotesDashboard notes={freshNotes} nextPage={null} counts={zeroCounts} />);

    expect(screen.getByText("Just Saved")).toBeInTheDocument();
    expect(screen.queryByText(/waiting for your charming notes/)).not.toBeInTheDocument();
  });

  it("opens an existing note pre-filled when its card is clicked", async () => {
    const user = userEvent.setup();
    const notes = [note({ id: 7, title: "Vacation Ideas", body: "Visit Bali" })];
    render(<NotesDashboard notes={notes} nextPage={null} counts={zeroCounts} />);

    await user.click(screen.getByTestId("note-card"));

    expect(screen.getByTestId("note-title-input")).toHaveValue("Vacation Ideas");
    expect(screen.getByTestId("note-body-textarea")).toHaveValue("Visit Bali");
  });

  it("filters the grid to only the selected category, and clears on All Categories", async () => {
    const user = userEvent.setup();
    const schoolNote = note({ id: 2, title: "Meeting Notes", category: "school" });
    mockedGetNotesAction.mockResolvedValueOnce({
      ok: true,
      notes: [schoolNote],
      nextPage: null,
    });

    const notes = [note({ id: 1, title: "Grocery List", category: "random_thoughts" }), schoolNote];
    render(<NotesDashboard notes={notes} nextPage={null} counts={zeroCounts} />);

    await user.click(screen.getByRole("button", { name: "Filter by School" }));

    expect(mockedGetNotesAction).toHaveBeenCalledWith({ category: "school", page: 1 });
    expect(await screen.findByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.queryByText("Grocery List")).not.toBeInTheDocument();

    mockedGetNotesAction.mockResolvedValueOnce({ ok: true, notes, nextPage: null });
    await user.click(screen.getByRole("button", { name: /All Categories/ }));

    expect(mockedGetNotesAction).toHaveBeenCalledWith({ category: undefined, page: 1 });
    expect(await screen.findByText("Grocery List")).toBeInTheDocument();
  });

  it("loads the next page when the sentinel intersects", async () => {
    const captured: { callback: IntersectionObserverCallback | null } = { callback: null };
    class CapturingObserver {
      constructor(callback: IntersectionObserverCallback) {
        captured.callback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", CapturingObserver);

    const pageTwoNote = note({ id: 2, title: "Second Page Note" });
    mockedGetNotesAction.mockResolvedValueOnce({ ok: true, notes: [pageTwoNote], nextPage: null });

    const notes = [note({ id: 1, title: "First Page Note" })];
    render(<NotesDashboard notes={notes} nextPage={2} counts={zeroCounts} />);

    captured.callback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(await screen.findByText("Second Page Note")).toBeInTheDocument();
    expect(screen.getByText("First Page Note")).toBeInTheDocument();
    expect(mockedGetNotesAction).toHaveBeenCalledWith({ category: undefined, page: 2 });
  });

  it("shows an error banner when a filtered fetch fails", async () => {
    const user = userEvent.setup();
    mockedGetNotesAction.mockResolvedValueOnce({ ok: false, error: "Failed to load notes." });
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    await user.click(screen.getByRole("button", { name: "Filter by School" }));

    expect(await screen.findByTestId("notes-error-banner")).toHaveTextContent(
      "Failed to load notes.",
    );
  });

  it("shows a loading indicator while a filtered fetch is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: { ok: true; notes: Note[]; nextPage: number | null }) => void =
      () => {};
    mockedGetNotesAction.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    await user.click(screen.getByRole("button", { name: "Filter by School" }));

    expect(await screen.findByText("Loading notes...")).toBeInTheDocument();

    resolveFetch({ ok: true, notes: [], nextPage: null });

    await waitFor(() => {
      expect(screen.queryByText("Loading notes...")).not.toBeInTheDocument();
    });
  });

  it("debounces search input and fetches matching notes", async () => {
    const user = userEvent.setup();
    const found = note({ id: 5, title: "Grocery List" });
    mockedGetNotesAction.mockResolvedValueOnce({ ok: true, notes: [found], nextPage: null });
    render(<NotesDashboard notes={[]} nextPage={null} counts={zeroCounts} />);

    await user.type(screen.getByTestId("notes-search-input"), "grocery");

    await waitFor(
      () => {
        expect(mockedGetNotesAction).toHaveBeenCalledWith({
          category: undefined,
          page: 1,
          search: "grocery",
        });
      },
      { timeout: 1500 },
    );
    expect(await screen.findByText("Grocery List")).toBeInTheDocument();
  });

  it("switches between grid and list layouts", async () => {
    const user = userEvent.setup();
    const notes = [note({ id: 1, title: "Grocery List" })];
    render(<NotesDashboard notes={notes} nextPage={null} counts={zeroCounts} />);

    expect(screen.getByTestId("notes-list").className).toMatch(/grid-cols/);

    await user.click(screen.getByTestId("view-mode-list"));

    expect(screen.getByTestId("notes-list").className).not.toMatch(/grid-cols/);
    expect(screen.getByTestId("notes-list").className).toMatch(/flex-col/);
  });
});
