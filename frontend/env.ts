import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export const env = envSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});
