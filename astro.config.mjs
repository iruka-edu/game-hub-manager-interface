// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

import vercel from "@astrojs/vercel";

// Check if we're in a Windows environment with symlink issues
const isWindows = process.platform === 'win32';
const useNodeAdapter = process.env.USE_NODE_ADAPTER === 'true' || (isWindows && process.env.VERCEL !== '1');

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: useNodeAdapter ? node({
    mode: "standalone"
  }) : vercel({
    imageService: true,
    devImageService: "sharp",
    maxDuration: 30, // Increase timeout for large uploads
    // Only keep valid configuration options
    excludeFiles: ['**/node_modules/**', '**/.git/**'],
    webAnalytics: {
      enabled: false
    }
  }),

  vite: {
    plugins: [tailwindcss()],
    server: {
      // Increase body size limit for development
      middlewareMode: false,
    },
    // Windows-specific optimizations
    optimizeDeps: {
      exclude: ['vitest']
    },
    resolve: {
      preserveSymlinks: false
    }
  },

  experimental: {
    svgo: true,
  },

  // Server configuration for body size limits
  server: {
    // This will be handled by Vercel in production
    // For local development, we'll handle it in the API routes
  },
});
