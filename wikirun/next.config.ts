import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['upload.wikimedia.org'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
