"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { apiUrl } from "@/env";
import { logger } from "@/lib/logger";
import { setAuthCookies } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  let response: Response;
  try {
    response = await fetch(apiUrl("/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch (err) {
    logger.error("Login request failed", {
      email: parsed.data.email,
      error: err instanceof Error ? err.message : String(err),
    });
    return { error: "Something went wrong. Please try again." };
  }

  if (!response.ok) {
    logger.warn("Login rejected", { email: parsed.data.email, status: response.status });
    return { error: "Invalid email or password." };
  }

  const { access, refresh } = (await response.json()) as {
    access: string;
    refresh: string;
  };

  logger.info("User logged in", { email: parsed.data.email });
  await setAuthCookies(access, refresh);

  redirect("/dashboard");
}
