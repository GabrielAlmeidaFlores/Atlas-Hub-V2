import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("/node_modules/recharts/")) return "charts";
          if (id.includes("/node_modules/victory-vendor/") || id.includes("/node_modules/d3-")) return "charts-vendor";
          if (id.includes("/node_modules/lodash/")) return "charts-utils";
          if (id.includes("/node_modules/react-grid-layout/") || id.includes("/node_modules/react-resizable/")) return "dashboardGrid";
          return undefined;
        },
      },
    },
  },
});
