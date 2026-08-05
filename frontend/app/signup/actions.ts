"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { apiUrl } from "@/env";
import { logger } from "@/lib/logger";
import { setAuthCookies } from "@/lib/session";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupFormState = {
  error?: string;
};

type SignupErrorBody = {
  email?: string[];
  password?: string[];
};

export async function signupAction(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and a password with at least 8 characters." };
  }

  let response: Response;
  try {
    response = await fetch(apiUrl("/api/v1/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch (err) {
    logger.error("Signup request failed", {
      email: parsed.data.email,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: "Something went wrong. Please try again." };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SignupErrorBody | null;
    const message =
      body?.email?.[0] ?? body?.password?.[0] ?? "Something went wrong. Please try again.";
    logger.warn("Signup rejected", { email: parsed.data.email, status: response.status });
    return { error: message };
  }

  const { access, refresh } = (await response.json()) as {
    access: string;
    refresh: string;
  };

  logger.info("User signed up", { email: parsed.data.email });
  await setAuthCookies(access, refresh);

  redirect("/dashboard");
}
