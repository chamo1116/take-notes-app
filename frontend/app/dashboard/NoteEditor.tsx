"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { formatLastEdited } from "@/lib/formatLastEdited";
import type { Note } from "@/lib/types";
import { createNoteAction, deleteNoteAction, updateNoteAction } from "./actions";
import { CategoryDropdown } from "./CategoryDropdown";

const AUTOSAVE_DELAY_MS = 1000;

type Props = {
  onClose: () => void;
  note?: Note;
};

export function NoteEditor({ onClose, note }: Props) {
  const [category, setCategory] = useState<CategorySlug>(note?.category ?? CATEGORIES[0].slug);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [updatedAt, setUpdatedAt] = useState<string | null>(note?.updatedAt ?? null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [, startTransition] = useTransition();

  const noteIdRef = useRef<number | null>(note?.id ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the effect's first run so opening an existing note (which starts
  // with non-empty fields) doesn't immediately schedule a no-op autosave.
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    setConfirmingDelete(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    const hasContent = title.trim() !== "" || body.trim() !== "";
    if (!hasContent && noteIdRef.current === null) return;

    timerRef.current = setTimeout(() => {
      const payload = { title, body, category };

      startTransition(async () => {
        const result =
          noteIdRef.current === null
            ? await createNoteAction(payload)
            : await updateNoteAction(noteIdRef.current, payload);

        if (result.ok) {
          setError(null);
          setUpdatedAt(result.updatedAt);
          noteIdRef.current = result.id;
        } else {
          setError(result.error);
        }
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, body, category]);

  const selectedCategory = CATEGORIES.find((item) => item.slug === category) ?? CATEGORIES[0];

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    const id = noteIdRef.current;
    if (id === null) {
      onClose();
      return;
    }

    startTransition(async () => {
      const result = await deleteNoteAction(id);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <div data-testid="note-editor" className="fixed inset-0 z-50 flex flex-col bg-cream p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <CategoryDropdown categories={CATEGORIES} selected={selectedCategory} onSelect={setCategory} />

        <div className="flex items-center gap-4">
          {updatedAt !== null && (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={confirmingDelete ? "Confirm delete note" : "Delete note"}
              data-testid="note-delete-button"
              className="font-inter text-sm text-red-700"
            >
              {confirmingDelete ? "Confirm delete?" : (
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13a1 1 0 01-1 1H8a1 1 0 01-1-1L6 7h12z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close note editor"
            className="text-brown"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M4 4l16 16M20 4L4 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        data-testid="note-rectangle"
        className="relative mt-6 flex flex-1 flex-col overflow-y-auto rounded-[32px] border p-6 sm:p-10"
        style={{ backgroundColor: selectedCategory.color, borderColor: selectedCategory.color }}
      >
        <div className="flex justify-end">
          <p className="font-inter text-sm text-brown" data-testid="note-last-edited">
            {updatedAt ? formatLastEdited(updatedAt) : " "}
          </p>
        </div>

        {error && (
          <p role="alert" data-testid="note-editor-error" className="text-right font-inter text-xs text-red-700">
            {error}
          </p>
        )}

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note Title"
          aria-label="Note title"
          data-testid="note-title-input"
          className="mt-4 w-full bg-transparent font-inria-serif text-3xl font-bold text-gray-900 placeholder:text-gray-900/70 focus:outline-none"
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Pour your heart out..."
          aria-label="Note body"
          data-testid="note-body-textarea"
          className="mt-4 flex-1 w-full resize-none bg-transparent font-inter text-base text-gray-900 placeholder:text-gray-700/70 focus:outline-none"
        />
      </div>
    </div>
  );
}
