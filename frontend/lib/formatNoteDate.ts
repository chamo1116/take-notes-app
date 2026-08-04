const monthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Date-only label for a note card: "today" / "yesterday" for the last two
// calendar days (compared in the caller's local time, not a rolling 24h
// window), otherwise "July 16" with no year.
export function formatNoteDate(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (isSameCalendarDay(date, now)) return "today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) return "yesterday";

  return monthDayFormatter.format(date);
}
