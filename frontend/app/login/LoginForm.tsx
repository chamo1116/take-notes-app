"use client";

import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "./actions";

export function LoginForm() {
  return (
    <AuthForm
      action={loginAction}
      submitLabel="Login"
      pendingLabel="Logging in..."
      errorTestId="login-error"
      linkHref="/signup"
      linkText="Oops! I've never been here before"
    />
  );
}
