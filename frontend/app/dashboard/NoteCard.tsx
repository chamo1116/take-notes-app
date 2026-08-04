import { CATEGORIES } from "@/lib/categories";
import { formatNoteDate } from "@/lib/formatNoteDate";
import type { Note } from "@/lib/types";

type Props = {
  note: Note;
  onClick: () => void;
};

export function NoteCard({ note, onClick }: Props) {
  const category = CATEGORIES.find((item) => item.slug === note.category) ?? CATEGORIES[0];

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="note-card"
      className="flex flex-col rounded-[24px] border p-5 text-left"
      style={{ backgroundColor: category.color, borderColor: category.color }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-inter text-sm font-bold text-gray-900" data-testid="note-card-date">
          {formatNoteDate(note.updatedAt)}
        </span>
        <span className="font-inter text-sm text-gray-900">{category.name}</span>
      </div>

      <h3 className="mt-2 line-clamp-2 font-inria-serif text-2xl font-bold text-gray-900">
        {note.title || "Note Title"}
      </h3>

      <p className="mt-2 line-clamp-4 whitespace-pre-line font-inter text-sm text-gray-900">
        {note.body || "Note content..."}
      </p>
    </button>
  );
}
