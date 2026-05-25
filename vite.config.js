import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Get the repository name from environment or default to empty string for root deployment
const repoName = process.env.VITE_REPO_NAME || '';

export default defineConfig(() => {
  return {
    // Base path will be set dynamically: 
    // - Empty string for root domain deployment (username.github.io)
    // - /repo-name/ for project pages (username.github.io/repo-name)
    base: repoName ? `/${repoName}/` : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            motion: ['motion/react'],
          },
        },
      },
    },
  };
});
