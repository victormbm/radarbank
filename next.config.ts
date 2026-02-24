import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permitir builds de produção mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Manter verificação de tipos rigorosa
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
