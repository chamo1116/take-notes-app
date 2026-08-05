import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // This project's multi-service Vercel deployment doesn't provision the
    // /_next/image optimization function for the frontend service, so
    // next/image falls back to a plain <img> pointing at the original file.
    unoptimized: true,
  },
};

export default nextConfig;
