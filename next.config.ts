import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output bundles only the necessary files for production.
  // Required for the Docker/Cloud Run deployment — produces .next/standalone.
  output: "standalone",

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
