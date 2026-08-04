const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatLastEdited(isoDate: string): string {
  const date = new Date(isoDate);
  const time = timeFormatter.format(date).replace(" ", "").toLowerCase();
  return `Last Edited: ${dateFormatter.format(date)} at ${time}`;
}
