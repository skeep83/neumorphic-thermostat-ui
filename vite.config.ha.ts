import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Home Assistant custom card build configuration
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    lib: {
      entry: path.resolve(__dirname, "src/main.tsx"),
      name: "NeuomorphicThermostatUI",
      fileName: (format) => `neumorphic-thermostat-ui.${format === "es" ? "js" : "umd.js"}`,
      formats: ["es"],
    },
    rollupOptions: {
      external: [],
      output: {
        dir: "dist",
        format: "es",
        entryFileNames: "neumorphic-thermostat-ui.js",
      },
    },
  },
});
