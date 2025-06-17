import { defineConfig } from 'vite';

export default defineConfig({
  base: '/GAMEPIXIJS_LAST/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    sourcemap: true,
    assetsDir: 'assets'
  }
}); 