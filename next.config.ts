import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/generated_reports/:path*',
        destination: '/api/reports/:path*',
      },
    ];
  },
};

export default nextConfig;
