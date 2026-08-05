"use client";

import { useEffect } from "react";

export default function SignupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Signup page render error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 py-12 text-center">
      <p className="max-w-md font-inria-serif text-2xl font-bold text-heading">
        Something went wrong loading this page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-brown px-5 py-2 font-inter text-sm font-bold text-brown"
      >
        Try again
      </button>
    </main>
  );
}
