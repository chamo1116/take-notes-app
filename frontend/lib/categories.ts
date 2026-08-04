export const CATEGORIES = [
  { slug: "random_thoughts", name: "Random Thoughts", color: "#DFA25E" },
  { slug: "personal", name: "Personal", color: "#93B2A8" },
  { slug: "school", name: "School", color: "#E9DE8E" },
  { slug: "drama", name: "Drama", color: "#C8CFA080" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export type Category = (typeof CATEGORIES)[number];

export function zeroCountsByCategory(): Record<CategorySlug, number> {
  return Object.fromEntries(CATEGORIES.map((category) => [category.slug, 0])) as Record<
    CategorySlug,
    number
  >;
}
