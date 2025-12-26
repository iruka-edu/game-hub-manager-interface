// @ts-check
import { defineConfig } from "astro/config";

import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({
    imageService: true,
    devImageService: "sharp",
    maxDuration: 30, // Increase timeout for large uploads
    // Workaround for Windows symlink issues
    functionPerRoute: false,
  }),

  vite: {
    plugins: [tailwindcss()],
    server: {
      // Increase body size limit for development
      middlewareMode: false,
    },
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
