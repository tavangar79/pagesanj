import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two builds (PRD §11): `build:client` -> dist/client (index.html template, CSS, assets),
// `build:server` -> dist/server/entry-server.js, which Express calls to render each page.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
});
