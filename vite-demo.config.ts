/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@demo': '/demo',
      '@lib': '/lib',
    },
  },
  build: {
    outDir: 'dist-demo',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './demo/test/setup.ts',
    css: true,
  },
});
