/**
 * Environment Configuration & Validation
 * 
 * This module validates all required environment variables at startup.
 * If any required variables are missing or invalid, the app will fail fast
 * with a clear error message instead of failing mysteriously at runtime.
 * 
 * Usage:
 *   import { env } from '@/config/env';
 *   const projectId = env.WALLETCONNECT_PROJECT_ID;
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),

  // WalletConnect (Required for wallet connections)
  VITE_WALLETCONNECT_PROJECT_ID: z
    .string()
    .min(1, 'WalletConnect Project ID is required')
    .regex(/^[a-f0-9]{32}$/, 'WalletConnect Project ID must be a 32-char hex string')
    .optional()
    .default(''), // Empty default for development, will show warning

  // Subgraph URLs
  VITE_SUBGRAPH_URL_MAINNET: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .default(''),
  
  VITE_SUBGRAPH_URL_BASE: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .default(''),

  // RPC URLs (fallbacks for when wallet doesn't provide)
  VITE_RPC_URL_MAINNET: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .default('https://eth.llamarpc.com'),

  VITE_RPC_URL_BASE: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .default('https://mainnet.base.org'),

  // Contract Addresses (optional overrides)
  VITE_GATEWAY_ROUTER_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .optional(),

  VITE_QUOTER_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
    .optional(),

  // Feature Flags
  VITE_ENABLE_TESTNET: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  // Error Tracking
  VITE_SENTRY_DSN: z
    .string()
    .url('Must be a valid Sentry DSN URL')
    .optional()
    .default(''),

  VITE_SENTRY_ENVIRONMENT: z
    .enum(['development', 'staging', 'production'])
    .optional()
    .default('development'),

  // API Keys (for price feeds, etc.)
  VITE_COINGECKO_API_KEY: z
    .string()
    .optional()
    .default(''),

  VITE_DEFILLAMA_API_KEY: z
    .string()
    .optional()
    .default(''),
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation & Export
// ─────────────────────────────────────────────────────────────────────────────

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // In browser, import.meta.env contains all VITE_ prefixed vars
  const rawEnv = {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    VITE_SUBGRAPH_URL_MAINNET: import.meta.env.VITE_SUBGRAPH_URL_MAINNET,
    VITE_SUBGRAPH_URL_BASE: import.meta.env.VITE_SUBGRAPH_URL_BASE,
    VITE_RPC_URL_MAINNET: import.meta.env.VITE_RPC_URL_MAINNET,
    VITE_RPC_URL_BASE: import.meta.env.VITE_RPC_URL_BASE,
    VITE_GATEWAY_ROUTER_ADDRESS: import.meta.env.VITE_GATEWAY_ROUTER_ADDRESS,
    VITE_QUOTER_ADDRESS: import.meta.env.VITE_QUOTER_ADDRESS,
    VITE_ENABLE_TESTNET: import.meta.env.VITE_ENABLE_TESTNET,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    VITE_COINGECKO_API_KEY: import.meta.env.VITE_COINGECKO_API_KEY,
    VITE_DEFILLAMA_API_KEY: import.meta.env.VITE_DEFILLAMA_API_KEY,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    console.error('❌ Environment validation failed:\n' + errorMessages);

    // In production, show a user-friendly error
    if (import.meta.env.PROD) {
      throw new Error('Application misconfigured. Please contact support.');
    }

    // In development, show detailed errors but continue with defaults
    console.warn('⚠️ Continuing with default values in development mode');
  }

  return result.success ? result.data : (envSchema.parse({}) as Env);
}

// Validate on module load
export const env = validateEnv();

// ─────────────────────────────────────────────────────────────────────────────
// Startup Warnings
// ─────────────────────────────────────────────────────────────────────────────

if (env.DEV) {
  const warnings: string[] = [];

  if (!env.VITE_WALLETCONNECT_PROJECT_ID) {
    warnings.push('VITE_WALLETCONNECT_PROJECT_ID not set - WalletConnect will not work');
  }

  if (!env.VITE_SUBGRAPH_URL_BASE) {
    warnings.push('VITE_SUBGRAPH_URL_BASE not set - using mock data');
  }

  if (warnings.length > 0) {
    console.warn(
      '⚠️ Development Environment Warnings:\n' +
      warnings.map(w => `  • ${w}`).join('\n')
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Type-safe accessors
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  isDev: env.DEV,
  isProd: env.PROD,
  
  walletConnect: {
    projectId: env.VITE_WALLETCONNECT_PROJECT_ID,
  },

  subgraph: {
    mainnet: env.VITE_SUBGRAPH_URL_MAINNET,
    base: env.VITE_SUBGRAPH_URL_BASE,
  },

  rpc: {
    mainnet: env.VITE_RPC_URL_MAINNET,
    base: env.VITE_RPC_URL_BASE,
  },

  contracts: {
    gatewayRouter: env.VITE_GATEWAY_ROUTER_ADDRESS,
    quoter: env.VITE_QUOTER_ADDRESS,
  },

  features: {
    testnet: env.VITE_ENABLE_TESTNET,
    analytics: env.VITE_ENABLE_ANALYTICS,
  },

  sentry: {
    dsn: env.VITE_SENTRY_DSN,
  },

  apiKeys: {
    coingecko: env.VITE_COINGECKO_API_KEY,
    defillama: env.VITE_DEFILLAMA_API_KEY,
  },
} as const;

export default config;
