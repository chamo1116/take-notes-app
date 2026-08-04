import { describe, expect, it } from "vitest";
import { formatNoteDate } from "@/lib/formatNoteDate";

describe("formatNoteDate", () => {
  it('returns "today" for a timestamp on the same calendar day', () => {
    const now = new Date("2026-08-04T09:00:00");
    expect(formatNoteDate("2026-08-04T23:58:00", now)).toBe("today");
  });

  it('returns "yesterday" for a timestamp on the previous calendar day', () => {
    const now = new Date("2026-08-04T09:00:00");
    expect(formatNoteDate("2026-08-03T00:02:00", now)).toBe("yesterday");
  });

  it("compares calendar days, not a rolling 24-hour window", () => {
    const now = new Date("2026-08-04T00:02:00");
    expect(formatNoteDate("2026-08-03T23:58:00", now)).toBe("yesterday");
    expect(formatNoteDate("2026-08-04T00:01:00", now)).toBe("today");
  });

  it("returns a month/day label with no year for older dates", () => {
    const now = new Date("2026-08-04T09:00:00");
    expect(formatNoteDate("2026-07-16T12:00:00", now)).toBe("July 16");
    expect(formatNoteDate("2025-06-11T12:00:00", now)).toBe("June 11");
  });
});
