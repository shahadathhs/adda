import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for Docker (node server.js).
  output: "standalone",
  // Workspace packages ship raw TypeScript source.
  transpilePackages: ["@adda/types", "@adda/shared", "@adda/api-client"],
  // Remote avatars/banners come straight from user-provided origins — skip
  // Next's image optimizer rather than whitelist every domain.
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
