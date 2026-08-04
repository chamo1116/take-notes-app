import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteEditor } from "./NoteEditor";
import { createNoteAction, updateNoteAction } from "./actions";

vi.mock("./actions", () => ({
  createNoteAction: vi.fn(),
  updateNoteAction: vi.fn(),
}));

const mockedCreateNoteAction = vi.mocked(createNoteAction);
const mockedUpdateNoteAction = vi.mocked(updateNoteAction);

// The editor autosaves 1s after the last keystroke; give assertions that
// wait on a save enough headroom above that real delay.
const AUTOSAVE_WAIT_OPTIONS = { timeout: 2000 };

describe("NoteEditor", () => {
  beforeEach(() => {
    mockedCreateNoteAction.mockReset();
    mockedUpdateNoteAction.mockReset();
  });

  it("renders the default category, title and body fields, and no timestamp yet", () => {
    render(<NoteEditor onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Random Thoughts/ })).toBeInTheDocument();
    expect(screen.getByTestId("note-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("note-body-textarea")).toBeInTheDocument();
    expect(screen.getByTestId("note-last-edited")).toHaveTextContent("");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NoteEditor onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close note editor" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not autosave an untouched note", async () => {
    render(<NoteEditor onClose={vi.fn()} />);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(mockedCreateNoteAction).not.toHaveBeenCalled();
  });

  it("creates the note after the user stops typing, then shows the last-edited timestamp", async () => {
    mockedCreateNoteAction.mockResolvedValue({
      ok: true,
      id: 1,
      updatedAt: "2024-07-21T20:39:00.000Z",
    });
    const user = userEvent.setup();
    render(<NoteEditor onClose={vi.fn()} />);

    await user.type(screen.getByTestId("note-title-input"), "Grocery list");

    await waitFor(() => {
      expect(mockedCreateNoteAction).toHaveBeenCalledWith({
        title: "Grocery list",
        body: "",
        category: "random_thoughts",
      });
    }, AUTOSAVE_WAIT_OPTIONS);

    await waitFor(() => {
      expect(screen.getByTestId("note-last-edited")).toHaveTextContent(
        "Last Edited: July 21, 2024 at 8:39pm",
      );
    });
  });

  it("updates an existing note on subsequent edits instead of creating a new one", async () => {
    mockedCreateNoteAction.mockResolvedValue({
      ok: true,
      id: 42,
      updatedAt: "2024-07-21T20:39:00.000Z",
    });
    mockedUpdateNoteAction.mockResolvedValue({
      ok: true,
      id: 42,
      updatedAt: "2024-07-21T20:40:00.000Z",
    });
    const user = userEvent.setup();
    render(<NoteEditor onClose={vi.fn()} />);

    await user.type(screen.getByTestId("note-title-input"), "First");
    await waitFor(
      () => expect(mockedCreateNoteAction).toHaveBeenCalledTimes(1),
      AUTOSAVE_WAIT_OPTIONS,
    );

    await user.type(screen.getByTestId("note-body-textarea"), "More content");

    await waitFor(() => {
      expect(mockedUpdateNoteAction).toHaveBeenCalledWith(42, {
        title: "First",
        body: "More content",
        category: "random_thoughts",
      });
    }, AUTOSAVE_WAIT_OPTIONS);
    expect(mockedCreateNoteAction).toHaveBeenCalledTimes(1);
  });

  it("switches the rectangle color when a different category is selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<NoteEditor onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Random Thoughts/ }));
    await user.click(screen.getByRole("option", { name: "Drama" }));

    const rectangle = container.querySelector('[style*="background-color"]');
    expect(rectangle).toHaveStyle({ backgroundColor: "#C8CFA080" });
  });

  it("shows an error message when saving fails", async () => {
    mockedCreateNoteAction.mockResolvedValue({ ok: false, error: "Failed to save note." });
    const user = userEvent.setup();
    render(<NoteEditor onClose={vi.fn()} />);

    await user.type(screen.getByTestId("note-title-input"), "Oops");

    await waitFor(() => {
      expect(screen.getByTestId("note-editor-error")).toHaveTextContent("Failed to save note.");
    }, AUTOSAVE_WAIT_OPTIONS);
  });

  it("prefills title, body, category and last-edited when editing an existing note", () => {
    render(
      <NoteEditor
        onClose={vi.fn()}
        note={{
          id: 42,
          title: "Vacation Ideas",
          body: "Visit Bali",
          category: "drama",
          updatedAt: "2024-07-21T20:39:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("note-title-input")).toHaveValue("Vacation Ideas");
    expect(screen.getByTestId("note-body-textarea")).toHaveValue("Visit Bali");
    expect(screen.getByRole("button", { name: /Drama/ })).toBeInTheDocument();
    expect(screen.getByTestId("note-last-edited")).toHaveTextContent(
      "Last Edited: July 21, 2024 at 8:39pm",
    );
  });

  it("does not autosave immediately when opening an existing note unedited", async () => {
    render(
      <NoteEditor
        onClose={vi.fn()}
        note={{
          id: 42,
          title: "Vacation Ideas",
          body: "Visit Bali",
          category: "drama",
          updatedAt: "2024-07-21T20:39:00.000Z",
        }}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(mockedUpdateNoteAction).not.toHaveBeenCalled();
    expect(mockedCreateNoteAction).not.toHaveBeenCalled();
  });

  it("calls updateNoteAction (not createNoteAction) on the first edit of an existing note", async () => {
    mockedUpdateNoteAction.mockResolvedValue({
      ok: true,
      id: 42,
      updatedAt: "2024-07-21T20:45:00.000Z",
    });
    const user = userEvent.setup();
    render(
      <NoteEditor
        onClose={vi.fn()}
        note={{
          id: 42,
          title: "Old title",
          body: "",
          category: "school",
          updatedAt: "2024-07-21T20:39:00.000Z",
        }}
      />,
    );

    await user.type(screen.getByTestId("note-title-input"), "!");

    await waitFor(() => {
      expect(mockedUpdateNoteAction).toHaveBeenCalledWith(42, {
        title: "Old title!",
        body: "",
        category: "school",
      });
    }, AUTOSAVE_WAIT_OPTIONS);
    expect(mockedCreateNoteAction).not.toHaveBeenCalled();
  });
});
