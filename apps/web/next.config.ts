import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@adda/types', '@adda/utils'],
};

export default nextConfig;
