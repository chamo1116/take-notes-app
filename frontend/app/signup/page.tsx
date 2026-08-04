import Image from "next/image";
import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 py-12">
      <Image src="/assets/cow.png" alt="" width={200} height={143} priority />
      <h1 className="text-center font-inria-serif text-3xl font-bold leading-none text-heading sm:text-5xl">
        Yay, New Friend!
      </h1>
      <SignupForm />
    </main>
  );
}
