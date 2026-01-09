import { defineConfig } from 'vite';
import { resolve } from 'path';

// Vite config for building Home Assistant custom card
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/ha-card/neumorphic-thermostat-ui.ts'),
      name: 'NeumorphicThermostatUI',
      formats: ['es'],
      fileName: () => 'neumorphic-thermostat-ui.js',
    },
    rollupOptions: {
      output: {
        // Ensure single file output without hashes
        entryFileNames: 'neumorphic-thermostat-ui.js',
        chunkFileNames: 'neumorphic-thermostat-ui.js',
        assetFileNames: 'neumorphic-thermostat-ui.[ext]',
        // Inline all dependencies
        inlineDynamicImports: true,
      },
    },
    // Keep build self-contained (no extra deps like terser required)
    minify: 'esbuild',
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
