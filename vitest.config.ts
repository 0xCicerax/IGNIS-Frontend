/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // ─────────────────────────────────────────────────────────────────────────────
    // Environment
    // ─────────────────────────────────────────────────────────────────────────────
    environment: 'jsdom',
    globals: true,
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────────
    setupFiles: ['./src/test/setup.ts'],
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Coverage
    // ─────────────────────────────────────────────────────────────────────────────
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/main.tsx',
        'src/abis/**',
      ],
      thresholds: {
        // Minimum coverage thresholds
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Include/Exclude
    // ─────────────────────────────────────────────────────────────────────────────
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Performance
    // ─────────────────────────────────────────────────────────────────────────────
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Reporting
    // ─────────────────────────────────────────────────────────────────────────────
    reporters: ['verbose'],
    
    // ─────────────────────────────────────────────────────────────────────────────
    // Timeouts
    // ─────────────────────────────────────────────────────────────────────────────
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
