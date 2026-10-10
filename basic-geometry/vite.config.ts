/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app is published at https://learning.hayden-gilbert.com/basic-geometry/
// Change BASE_PATH at build time to deploy somewhere else, e.g.
//   BASE_PATH=/ npm run build
const base = process.env.BASE_PATH ?? '/basic-geometry/';

export default defineConfig({
  base: base.endsWith('/') ? base : `${base}/`,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], katex: ['katex'] },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
