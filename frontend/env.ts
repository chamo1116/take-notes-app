import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

// Validated lazily, on first use inside a request, rather than at module
// load. Vercel's multi-service bindings only resolve env vars at runtime,
// not at build time, so eagerly parsing here crashed the entire build
// (Next.js evaluates every page's module graph during "Collecting page
// data") whenever API_BASE_URL wasn't yet available.
export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse({ API_BASE_URL: process.env.API_BASE_URL });
  }
  return cached;
}

// Vercel's service-binding URLs are an "absolute URL base" and may already
// end in a slash, so naively concatenating a leading-slash path produces
// "https://host//api/...", which Django's router never matches. Normalize
// to exactly one slash between base and path regardless of either side.
export function apiUrl(path: string): string {
  const base = getEnv().API_BASE_URL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
