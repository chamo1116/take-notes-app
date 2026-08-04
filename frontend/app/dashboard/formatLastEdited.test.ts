import { describe, expect, it } from "vitest";
import { formatLastEdited } from "@/lib/formatLastEdited";

describe("formatLastEdited", () => {
  it("formats an ISO date into the 'Last Edited: <date> at <time>' shape", () => {
    const result = formatLastEdited("2024-07-21T20:39:00.000Z");

    expect(result).toBe("Last Edited: July 21, 2024 at 8:39pm");
  });

  it("lowercases am/pm and drops the space before it", () => {
    const result = formatLastEdited("2024-01-05T09:05:00.000Z");

    expect(result).toBe("Last Edited: January 5, 2024 at 9:05am");
  });
});
