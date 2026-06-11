import { baseConfig } from './base.js';

export const nextConfig = [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
];
