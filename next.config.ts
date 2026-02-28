import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Custom server handles Socket.IO; disable Turbopack interference
  experimental: {},
};

export default nextConfig;
