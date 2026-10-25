import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fully static site: no server needed, deploys to Vercel's CDN as is.
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;
