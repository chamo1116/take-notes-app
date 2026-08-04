import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { zeroCountsByCategory } from "@/lib/categories";
import { getCategoryCountsAction, getNotesAction } from "./actions";
import { NotesDashboard } from "./NotesDashboard";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    redirect("/login");
  }

  const [notesResult, countsResult] = await Promise.all([
    getNotesAction(),
    getCategoryCountsAction(),
  ]);

  const notes = notesResult.ok ? notesResult.notes : [];
  const nextPage = notesResult.ok ? notesResult.nextPage : null;
  const counts = countsResult.ok ? countsResult.counts : zeroCountsByCategory();

  return <NotesDashboard notes={notes} nextPage={nextPage} counts={counts} />;
}
