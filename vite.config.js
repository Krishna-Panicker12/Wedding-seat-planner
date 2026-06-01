import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'safari >= 12', 'Samsung >= 12'],
      modernPolyfills: true,
    }),
  ],
  test: {
    environment: 'node',
  },
});
