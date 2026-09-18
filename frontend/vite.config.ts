import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // .env лежит в корне монорепо, а не в frontend/
  envDir: '..',
  server: { port: 5173, host: true },
});
