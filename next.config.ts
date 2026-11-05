import type { NextConfig } from "next";

// Cache Components is off for v1: every DB-backed page opts into
// request-time rendering with `export const dynamic = "force-dynamic"`.
const nextConfig: NextConfig = {
  // PGlite ships WASM + data files; keep it out of the bundle so Node loads it directly.
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
