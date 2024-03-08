import { resolve } from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts({ include: ["lib"], rollupTypes: true })],
  build: {
    copyPublicDir: false,
    // target: 'esnext',
    // minify: false,
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      formats: ["es"],
    },
  },
});
