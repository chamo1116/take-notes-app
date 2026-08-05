import type { Category } from "@/lib/categories";

type Props = {
  category: Category;
  nameClassName?: string;
};

export function CategorySwatch({ category, nameClassName }: Props) {
  return (
    <>
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      <span className={nameClassName}>{category.name}</span>
    </>
  );
}
