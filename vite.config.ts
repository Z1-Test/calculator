/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
