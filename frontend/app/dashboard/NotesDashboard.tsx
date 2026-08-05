"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import type { Note } from "@/lib/types";
import { getNotesAction, type CategoryCounts } from "./actions";
import { CategorySwatch } from "./CategorySwatch";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";

type Props = {
  notes: Note[];
  nextPage: number | null;
  counts: CategoryCounts;
};

type Filter = CategorySlug | "all";
type EditorTarget = "new" | Note;
type ViewMode = "grid" | "list";

export function NotesDashboard({ notes: initialNotes, nextPage: initialNextPage, counts }: Props) {
  const router = useRouter();
  const [editorTarget, setEditorTarget] = useState<EditorTarget | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [notes, setNotes] = useState(initialNotes);
  const [nextPage, setNextPage] = useState(initialNextPage);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setSearch("");
  }

  function fetchNotes(page: number, category: Filter, query: string, mode: "replace" | "append") {
    isLoadingRef.current = true;
    if (mode === "append") {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    startTransition(async () => {
      const result = await getNotesAction({
        category: category === "all" ? undefined : category,
        page,
        search: query || undefined,
      });
      if (result.ok) {
        setErrorMessage(null);
        setNotes((previous) => (mode === "append" ? [...previous, ...result.notes] : result.notes));
        setNextPage(result.nextPage);
      } else {
        setErrorMessage(result.error);
      }
      isLoadingRef.current = false;
      setIsLoading(false);
      setIsLoadingMore(false);
    });
  }

  function selectFilter(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    fetchNotes(1, next, search, "replace");
  }

  function loadMore() {
    if (nextPage === null || isLoadingRef.current) return;
    fetchNotes(nextPage, filter, search, "append");
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

  // Debounce search-as-you-type so we don't fire a request per keystroke;
  // skip the first render so mounting doesn't immediately refetch.
  const isFirstSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => fetchNotes(1, filter, search, "replace"), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function closeEditor() {
    setEditorTarget(null);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-6 sm:px-10 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notes..."
          aria-label="Search notes"
          data-testid="notes-search-input"
          className="w-full max-w-sm rounded-full border border-brown/40 bg-white/60 px-5 py-2 font-inter text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
        />

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

      {errorMessage && (
        <p
          role="alert"
          data-testid="notes-error-banner"
          className="mt-4 rounded-lg bg-red-50 px-4 py-2 font-inter text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

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
                  <CategorySwatch category={category} nameClassName="font-inter text-sm text-gray-900" />
                  <span className="ml-auto font-inter text-xs text-gray-500">
                    {counts[category.slug] ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p
              aria-live="polite"
              data-testid="notes-loading-indicator"
              className="font-inter text-xs text-gray-500"
            >
              {isLoading ? "Loading notes..." : ""}
            </p>

            <div className="flex items-center gap-2" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Grid view"
                data-testid="view-mode-grid"
                className={viewMode === "grid" ? "text-brown" : "text-gray-400"}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
                  <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
                  <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
                data-testid="view-mode-list"
                className={viewMode === "list" ? "text-brown" : "text-gray-400"}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <rect x="3" y="4" width="18" height="3.5" rx="1.5" fill="currentColor" />
                  <rect x="3" y="10.25" width="18" height="3.5" rx="1.5" fill="currentColor" />
                  <rect x="3" y="16.5" width="18" height="3.5" rx="1.5" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
              <Image src="/assets/coffe_waiting.png" alt="" width={220} height={220} priority />
              <p className="max-w-2xl font-inter text-2xl text-brown">
                {search
                  ? "No notes match your search."
                  : "I'm just here waiting for your charming notes..."}
              </p>
            </div>
          ) : (
            <>
              <div
                data-testid="notes-list"
                className={
                  viewMode === "grid"
                    ? "mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    : "mt-4 flex flex-col gap-4"
                }
              >
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} onClick={() => setEditorTarget(note)} />
                ))}
              </div>
              {isLoadingMore && (
                <div className="mt-6 flex justify-center" role="status" aria-live="polite">
                  <span
                    data-testid="notes-loading-more-spinner"
                    aria-label="Loading more notes"
                    className="h-6 w-6 animate-spin rounded-full border-2 border-brown/30 border-t-brown"
                  />
                </div>
              )}
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
