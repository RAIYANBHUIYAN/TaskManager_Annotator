import type { NextConfig } from "next";
import path from "path";

const emptyCanvas = path.join(__dirname, "src/lib/empty-canvas.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["konva", "canvas"],
  turbopack: {
    resolveAlias: {
      canvas: emptyCanvas,
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: emptyCanvas,
      };
    }
    return config;
  },
};

export default nextConfig;
