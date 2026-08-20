import { fileURLToPath, URL } from "node:url";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackRouter({ autoCodeSplitting: true }), react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Tauri loads a fixed devUrl, so the port must not drift.
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    strictPort: !!process.env.TAURI_ENV_PLATFORM,
  },
});
