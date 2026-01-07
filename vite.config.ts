import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      // Disable sourcemaps in production for security
      // Or use 'hidden' to upload to error tracking privately
      sourcemap: isProd ? false : true,
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for React ecosystem
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Vendor chunk for Web3
            'vendor-web3': ['wagmi', 'viem', '@wagmi/core', '@wagmi/connectors'],
            // Vendor chunk for other utilities
            'vendor-utils': ['@tanstack/react-query', 'zod'],
          },
        },
      },
      // Increase warning limit for larger bundles
      chunkSizeWarningLimit: 1000,
      // Minification settings
      minify: isProd ? 'esbuild' : false,
      // Target modern browsers for smaller bundles
      target: 'es2020',
    },

    server: {
      port: 3000,
      open: true,
      // Strict port - fail if port in use
      strictPort: true,
    },

    preview: {
      port: 4173,
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'wagmi', 'viem'],
    },

    // Environment variable handling
    envPrefix: 'VITE_',
  };
})

