"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { loginAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full max-w-[384px] flex-col items-center gap-4">
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

      {state.error && (
        <p role="alert" data-testid="login-error" className="font-inter text-xs text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-brown py-2 font-inria-serif text-xl font-bold text-brown transition-opacity disabled:opacity-60"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>

      <Link href="/signup" className="font-inter text-xs font-normal text-brown underline">
        Oops! I&apos;ve never been here before
      </Link>
    </form>
  );
}
