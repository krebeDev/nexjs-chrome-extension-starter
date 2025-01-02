import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.NODE_ENV === "production" ? "/." : "",
  output: "export",
  trailingSlash: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add custom entry points for background and content scripts
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries =
          typeof originalEntry === "function"
            ? await originalEntry()
            : originalEntry;

        return {
          ...entries,
          background: path.resolve(__dirname, "app/background.ts"),
          content: path.resolve(__dirname, "app/content.ts"),
        };
      };

      // Ensure proper output for these scripts
      config.output = {
        ...config.output,
        filename: (pathData: { chunk?: { name?: string } }) => {
          const name = pathData.chunk?.name;
          if (name === "background" || name === "content") {
            return "[name].js";
          }
          return "[name].[contenthash].js";
        },
      };
    }

    return config;
  },
};

export default nextConfig;
