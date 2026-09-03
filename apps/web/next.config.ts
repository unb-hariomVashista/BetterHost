import type { NextConfig } from "next";

const apiPort = process.env.API_PORT || "8085";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://127.0.0.1:${apiPort}/api/:path*`,
      },
      {
        source: "/projects/:slug/:depSlug/:path*",
        destination: `http://127.0.0.1:${apiPort}/projects/:slug/:depSlug/:path*`,
      },
    ];
  },
};

export default nextConfig;
