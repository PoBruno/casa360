import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Explicitly configure JSX processing
      include: '**/*.{jsx,js,ts,tsx}',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx']
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  server: {
    port: 3000,
    open: true,
  }
});