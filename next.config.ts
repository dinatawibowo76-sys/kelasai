import type { NextConfig } from "next";

// Check if running on a cloud platform with read-only filesystem
const IS_CLOUD = !!(process.env.VERCEL || process.env.NETLIFY);

const nextConfig: NextConfig = {
  // "standalone" output is for Docker/self-hosted deployments only.
  // Cloud platforms (Vercel, Netlify) handle their own build output.
  ...(IS_CLOUD ? {} : { output: "standalone" }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
