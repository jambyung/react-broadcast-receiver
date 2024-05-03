/// <reference types="vitest" />

import { resolve } from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts({ include: ['lib'], rollupTypes: true })],
  resolve: {
    alias: {
      '@lib': '/lib',
    },
  },
  build: {
    copyPublicDir: false,
    target: 'esnext',
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // exclude react and react-dom from the bundle
      external: ['react', 'react-dom'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    css: true,
    coverage: {
      include: ['lib'],
    },
  },
});
