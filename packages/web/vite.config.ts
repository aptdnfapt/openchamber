import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { themeStoragePlugin } from '../../vite-theme-plugin';
import { visualizer } from 'rollup-plugin-visualizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  root: path.resolve(__dirname, '.'),
  plugins: [
    react(),
    themeStoragePlugin(),
    visualizer({
      filename: 'bundle-stats.html',
      open: false,
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: [
      { find: '@opencode-ai/sdk/v2', replacement: path.resolve(__dirname, '../../node_modules/@opencode-ai/sdk/dist/v2/client.js') },
      { find: '@openchamber/ui', replacement: path.resolve(__dirname, '../ui/src') },
      { find: '@web', replacement: path.resolve(__dirname, './src') },
      { find: '@', replacement: path.resolve(__dirname, '../ui/src') },
    ],
  },
  worker: {
    format: 'es',
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  optimizeDeps: {
    include: ['@opencode-ai/sdk/v2'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      external: ['node:child_process', 'node:fs', 'node:path', 'node:url'],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Handle Bun's .bun symlink paths: node_modules/.bun/@pkg+name@version/node_modules/@pkg/name/...
          // Extract the LAST node_modules segment to get actual package
          const parts = id.split('node_modules/');
          const match = parts[parts.length - 1];
          if (!match || match.startsWith('.')) return undefined;

          const segments = match.split('/');
          const packageName = match.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];

          // Core React - keep small and cacheable
          if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') return 'vendor-react';
          
          // State management
          if (packageName === 'zustand') return 'vendor-zustand';

          // OpenCode SDK
          if (packageName === '@opencode-ai/sdk') return 'vendor-opencode-sdk';
          
          // Markdown rendering stack
          if (packageName.includes('remark') || packageName.includes('rehype') || 
              packageName.includes('mdast') || packageName.includes('hast') ||
              packageName.includes('unified') || packageName.includes('unist') ||
              packageName === 'react-markdown') return 'vendor-markdown';
          
          // UI primitives - Radix
          if (packageName.startsWith('@radix-ui')) return 'vendor-radix';
          
          // Syntax highlighting - LARGE, should be lazy loaded ideally
          if (packageName.includes('react-syntax-highlighter') || 
              packageName.includes('highlight.js') ||
              packageName.includes('refractor') ||
              packageName.includes('prismjs') ||
              packageName.includes('prism-')) return 'vendor-syntax';
          
          // Terminal emulator
          if (packageName.includes('ghostty') || packageName.includes('xterm')) return 'vendor-terminal';
          
          // HeroUI components
          if (packageName.startsWith('@heroui')) return 'vendor-heroui';
          
          // Icons
          if (packageName.includes('remixicon')) return 'vendor-icons';
          
          // Fonts - usually just CSS, small
          if (packageName.includes('fontsource')) return 'vendor-fonts';

          // Motion/animation
          if (packageName === 'motion' || packageName === 'framer-motion') return 'vendor-motion';

          // Catch-all for remaining packages - group by package
          const sanitized = packageName.replace(/^@/, '').replace(/\//g, '-');
          return `vendor-${sanitized}`;
        },
      },
    },
  },
});
