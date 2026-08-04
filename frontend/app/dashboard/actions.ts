"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/env";
import { CATEGORIES, zeroCountsByCategory, type CategorySlug } from "@/lib/categories";
import { logger } from "@/lib/logger";
import { clearAuthCookies } from "@/lib/session";
import type { Note } from "@/lib/types";

const categorySlugs = CATEGORIES.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[],
];

const noteInputSchema = z.object({
  title: z.string().max(200),
  body: z.string(),
  category: z.enum(categorySlugs),
});

export type NoteActionResult =
  | { ok: true; id: number; updatedAt: string }
  | { ok: false; error: string };

async function noteRequest(path: string, init: RequestInit): Promise<Response | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;

  const url = path.startsWith("http") ? path : `${env.API_BASE_URL}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

// Called once a request either couldn't be attempted (no access_token
// cookie) or came back 401 (expired/invalid token) — either way the
// session is dead, so drop the stale cookies and send the user to log in
// again instead of leaving them stuck looking at a generic error.
async function redirectToLogin(): Promise<never> {
  await clearAuthCookies();
  redirect("/login");
}

type BackendNote = {
  id: number;
  title: string;
  body: string;
  category: CategorySlug;
  updated_at: string;
};

function toNote(backendNote: BackendNote): Note {
  return {
    id: backendNote.id,
    title: backendNote.title,
    body: backendNote.body,
    category: backendNote.category,
    updatedAt: backendNote.updated_at,
  };
}

export async function createNoteAction(input: unknown): Promise<NoteActionResult> {
  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid note data." };
  }

  let response: Response | null;
  try {
    response = await noteRequest("/api/v1/notes/", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
  } catch (err) {
    logger.error("Create note request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (!response) return redirectToLogin();
  if (response.status === 401) return redirectToLogin();
  if (!response.ok) {
    logger.error("Failed to create note", { status: response.status });
    return { ok: false, error: "Failed to save note." };
  }

  const note = (await response.json()) as BackendNote;
  return { ok: true, id: note.id, updatedAt: note.updated_at };
}

export async function updateNoteAction(id: number, input: unknown): Promise<NoteActionResult> {
  const parsed = noteInputSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid note data." };
  }

  let response: Response | null;
  try {
    response = await noteRequest(`/api/v1/notes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
  } catch (err) {
    logger.error("Update note request failed", {
      noteId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (!response) return redirectToLogin();
  if (response.status === 401) return redirectToLogin();
  if (!response.ok) {
    logger.error("Failed to update note", { noteId: id, status: response.status });
    return { ok: false, error: "Failed to save note." };
  }

  const note = (await response.json()) as BackendNote;
  return { ok: true, id: note.id, updatedAt: note.updated_at };
}

export type NotesPageResult =
  | { ok: true; notes: Note[]; nextPage: number | null }
  | { ok: false; error: string };

export async function getNotesAction(
  params: { category?: CategorySlug; page?: number } = {},
): Promise<NotesPageResult> {
  const page = params.page ?? 1;
  const search = new URLSearchParams({ page: String(page) });
  if (params.category) search.set("category", params.category);

  let response: Response | null;
  try {
    response = await noteRequest(`/api/v1/notes/?${search.toString()}`, { method: "GET" });
  } catch (err) {
    logger.error("List notes request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Failed to load notes." };
  }

  if (!response) return redirectToLogin();
  if (response.status === 401) return redirectToLogin();
  if (!response.ok) {
    logger.error("Failed to list notes", { status: response.status });
    return { ok: false, error: "Failed to load notes." };
  }

  const data = (await response.json()) as { results: BackendNote[]; next: string | null };
  return {
    ok: true,
    notes: data.results.map(toNote),
    nextPage: data.next ? page + 1 : null,
  };
}

export type CategoryCounts = Record<CategorySlug, number>;

export async function getCategoryCountsAction(): Promise<
  { ok: true; counts: CategoryCounts } | { ok: false; error: string }
> {
  let response: Response | null;
  try {
    response = await noteRequest("/api/v1/notes/category-counts/", { method: "GET" });
  } catch (err) {
    logger.error("Category counts request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "Failed to load category counts." };
  }

  if (!response) return redirectToLogin();
  if (response.status === 401) return redirectToLogin();
  if (!response.ok) {
    logger.error("Failed to load category counts", { status: response.status });
    return { ok: false, error: "Failed to load category counts." };
  }

  const raw = (await response.json()) as Partial<Record<CategorySlug, number>>;
  const counts = zeroCountsByCategory();
  for (const category of CATEGORIES) {
    counts[category.slug] = raw[category.slug] ?? 0;
  }
  return { ok: true, counts };
}
