import type { CategorySlug } from "@/lib/categories";

export type Note = {
  id: number;
  title: string;
  body: string;
  category: CategorySlug;
  updatedAt: string;
};
