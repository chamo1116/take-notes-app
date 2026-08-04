import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const CATEGORIES = [
  { name: "Random Thoughts", color: "#DFA25E" },
  { name: "School", color: "#E9DE8E" },
  { name: "Personal", color: "#93B2A8" },
];

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="relative min-h-screen bg-cream">
      <div className="absolute right-6 top-6 sm:right-10 sm:top-10">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-brown px-5 py-2 font-inria-serif text-lg font-bold text-brown"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
          New Note
        </button>
      </div>

      <div className="absolute left-6 top-24 sm:left-10 sm:top-28">
        <h2 className="font-inter text-sm font-bold text-gray-900">All Categories</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {CATEGORIES.map((category) => (
            <li key={category.name} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-inter text-sm text-gray-900">{category.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <Image src="/assets/coffe_waiting.png" alt="" width={220} height={220} priority />
        <p className="max-w-2xl font-inter text-2xl text-brown">
          I&apos;m just here waiting for your charming notes...
        </p>
      </div>
    </main>
  );
}
