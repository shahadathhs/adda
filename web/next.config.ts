import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server for Docker (node server.js).
  output: "standalone",
  // Remote avatars/banners come straight from user-provided origins — skip
  // Next's image optimizer rather than whitelist every domain.
  images: { unoptimized: true },
};

export default nextConfig;
