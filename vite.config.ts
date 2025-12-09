import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/unidetect/',
  server: {
    port: 3000,
    open: !process.env.DOCKER,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
