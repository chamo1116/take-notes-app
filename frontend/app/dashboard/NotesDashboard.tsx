"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import type { Note } from "@/lib/types";
import { getNotesAction, type CategoryCounts } from "./actions";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";

type Props = {
  notes: Note[];
  nextPage: number | null;
  counts: CategoryCounts;
};

type Filter = CategorySlug | "all";
type EditorTarget = "new" | Note;

export function NotesDashboard({ notes: initialNotes, nextPage: initialNextPage, counts }: Props) {
  const router = useRouter();
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [notes, setNotes] = useState(initialNotes);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [, startTransition] = useTransition();

  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // router.refresh() (see closeEditor) re-runs page.tsx and hands us a new
  // `notes`/`nextPage` prop pair, but a useState initializer only reads its
  // argument on mount. Resync during render (React's documented pattern for
  // "adjusting state when a prop changes") rather than in an effect, and
  // drop back to the unfiltered view since that's what the refreshed props
  // represent.
  const [prevInitialNotes, setPrevInitialNotes] = useState(initialNotes);
  if (initialNotes !== prevInitialNotes) {
    setPrevInitialNotes(initialNotes);
    setNotes(initialNotes);
    setNextPage(initialNextPage);
    setFilter("all");
  }

  function selectFilter(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    isLoadingRef.current = true;
    startTransition(async () => {
      const result = await getNotesAction({
        category: next === "all" ? undefined : next,
        page: 1,
      });
      if (result.ok) {
        setNotes(result.notes);
        setNextPage(result.nextPage);
      }
      isLoadingRef.current = false;
    });
  }

  function loadMore() {
    if (nextPage === null || isLoadingRef.current) return;
    isLoadingRef.current = true;
    startTransition(async () => {
      const result = await getNotesAction({
        category: filter === "all" ? undefined : filter,
        page: nextPage,
      });
      if (result.ok) {
        setNotes((previous) => [...previous, ...result.notes]);
        setNextPage(result.nextPage);
      }
      isLoadingRef.current = false;
    });
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || nextPage === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPage, filter]);

  function closeEditor() {
    setEditorTarget(null);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-6 sm:px-10 sm:py-10">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditorTarget("new")}
          className="flex items-center gap-2 rounded-full border border-brown px-5 py-2 font-inria-serif text-lg font-bold text-brown"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
          New Note
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-10 sm:flex-row">
        <aside className="flex-shrink-0 sm:w-52">
          <h2 className="font-inter text-sm font-bold text-gray-900">
            <button type="button" onClick={() => selectFilter("all")} aria-pressed={filter === "all"}>
              All Categories
            </button>
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => selectFilter(category.slug)}
                  aria-pressed={filter === category.slug}
                  aria-label={`Filter by ${category.name}`}
                  className="flex w-full items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-inter text-sm text-gray-900">{category.name}</span>
                  <span className="ml-auto font-inter text-xs text-gray-500">
                    {counts[category.slug] ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          {notes.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
              <Image src="/assets/coffe_waiting.png" alt="" width={220} height={220} priority />
              <p className="max-w-2xl font-inter text-2xl text-brown">
                I&apos;m just here waiting for your charming notes...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} onClick={() => setEditorTarget(note)} />
                ))}
              </div>
              <div ref={sentinelRef} aria-hidden="true" className="h-1" />
            </>
          )}
        </div>
      </div>

      {editorTarget && (
        <NoteEditor
          key={editorTarget === "new" ? "new" : editorTarget.id}
          onClose={closeEditor}
          note={editorTarget === "new" ? undefined : editorTarget}
        />
      )}
    </main>
  );
}
