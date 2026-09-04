import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Enable React strict mode for production safety */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
