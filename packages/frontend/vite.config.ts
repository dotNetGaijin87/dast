import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser reaches the API via VITE_API_BASE_URL (absolute), so no dev proxy
// is required. In containers this is baked at build time (see web Dockerfile).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 5173,
  },
});
