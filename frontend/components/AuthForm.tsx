"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";

export type AuthFormState = {
  error?: string;
};

type Props = {
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  pendingLabel: string;
  errorTestId: string;
  linkHref: string;
  linkText: string;
};

const initialState: AuthFormState = {};

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  errorTestId,
  linkHref,
  linkText,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
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
        <p role="alert" data-testid={errorTestId} className="font-inter text-xs text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-brown py-2 font-inria-serif text-xl font-bold text-brown transition-opacity disabled:opacity-60"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>

      <Link href={linkHref} className="font-inter text-xs font-normal text-brown underline">
        {linkText}
      </Link>
    </form>
  );
}
