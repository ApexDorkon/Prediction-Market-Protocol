import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Fixes PNG sequences and dynamic images
  },
  eslint: {
    // This allows production builds to successfully complete even if
    // your project has ESLint errors (like unused variables).
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows the build to continue even if there are type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;