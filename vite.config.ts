import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 3000
  },
  build: {
    sourcemap: true,
    assetsDir: 'assets'
  }
}); 