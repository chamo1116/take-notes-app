"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No signup endpoint yet — this is a UI-only placeholder until account
    // creation is wired up on the backend.
    setMessage("Sign up isn't available yet — check back soon!");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[384px] flex-col items-center gap-4">
      <input
        type="email"
        name="email"
        placeholder="Email address"
        required
        className="h-[39px] w-full rounded-full border border-brown bg-transparent px-4 font-inter text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brown"
      />

      <div className="relative w-full">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          required
          className="h-[39px] w-full rounded-full border border-brown bg-transparent px-4 pr-11 font-inter text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brown"
        />
        <PasswordVisibilityToggle
          visible={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
        />
      </div>

      {message && (
        <p role="alert" data-testid="signup-message" className="font-inter text-xs text-red-600">
          {message}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-full border border-brown py-2 font-inria-serif text-xl font-bold text-brown transition-opacity"
      >
        Sign Up
      </button>

      <Link href="/login" className="font-inter text-xs font-normal text-brown underline">
        We&apos;re already friends!
      </Link>
    </form>
  );
}
