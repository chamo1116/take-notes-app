"use client";

import { AuthForm } from "@/components/AuthForm";
import { signupAction } from "./actions";

export function SignupForm() {
  return (
    <AuthForm
      action={signupAction}
      submitLabel="Sign Up"
      pendingLabel="Signing up..."
      errorTestId="signup-message"
      linkHref="/login"
      linkText="We're already friends!"
    />
  );
}
