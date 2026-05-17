import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is for Docker/self-hosted deployments only.
  // Vercel handles its own build output, so we conditionally disable it.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
