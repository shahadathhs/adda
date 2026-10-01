import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Workspace packages ship as TypeScript source — keep the dev pre-bundler
  // away from them so they're transformed as app source.
  optimizeDeps: {
    exclude: ["@adda/types", "@adda/shared", "@adda/api-client"],
  },
  // Tauri loads a fixed devUrl, so the port must not drift.
  clearScreen: false,
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
});
