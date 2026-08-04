import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 py-12">
      <Image src="/assets/cactus.png" alt="" width={134} height={160} priority />
      <h1 className="text-center font-inria-serif text-3xl font-bold leading-none text-heading sm:text-5xl">
        Yay, You&apos;re Back!
      </h1>
      <LoginForm />
    </main>
  );
}
