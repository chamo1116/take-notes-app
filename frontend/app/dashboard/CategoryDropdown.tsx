"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, CategorySlug } from "@/lib/categories";
import { CategorySwatch } from "./CategorySwatch";

type Props = {
  categories: readonly Category[];
  selected: Category;
  onSelect: (slug: CategorySlug) => void;
};

export function CategoryDropdown({ categories, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const otherCategories = categories.filter((category) => category.slug !== selected.slug);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-brown bg-cream px-5 py-2 font-inria-serif text-lg font-bold text-brown"
      >
        <CategorySwatch category={selected} />
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={`h-2.5 w-3 fill-brown transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-10 mt-2 w-52 overflow-hidden rounded-2xl bg-cream py-2 shadow-lg ring-1 ring-brown/20"
        >
          {otherCategories.map((category) => (
            <li key={category.slug}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(category.slug);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left font-inter text-sm text-gray-900 hover:bg-black/5"
              >
                <CategorySwatch category={category} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
