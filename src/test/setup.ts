/** Module */

import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────────
// GLOBAL MOCKS
// ─────────────────────────────────────────────────────────────────────────────────

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock scrollTo
window.scrollTo = vi.fn();

// ─────────────────────────────────────────────────────────────────────────────────
// ENVIRONMENT MOCKS
// ─────────────────────────────────────────────────────────────────────────────────

vi.mock('@/config/env', () => ({
  env: {
    MODE: 'test',
    DEV: true,
    PROD: false,
    VITE_WALLETCONNECT_PROJECT_ID: 'test-project-id',
    VITE_SUBGRAPH_URL_BASE: 'https://test.subgraph.com',
    VITE_RPC_URL_BASE: 'https://test.rpc.com',
    VITE_ENABLE_TESTNET: true,
    VITE_ENABLE_ANALYTICS: false,
  },
  config: {
    isDev: true,
    isProd: false,
    walletConnect: { projectId: 'test-project-id' },
    subgraph: { base: 'https://test.subgraph.com' },
    rpc: { base: 'https://test.rpc.com' },
    features: { testnet: true, analytics: false },
  },
}));

// ─────────────────────────────────────────────────────────────────────────────────
// WAGMI MOCKS
// ─────────────────────────────────────────────────────────────────────────────────

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(() => ({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
    })),
    useChainId: vi.fn(() => 8453), // Base mainnet
    usePublicClient: vi.fn(() => ({
      readContract: vi.fn(),
      estimateContractGas: vi.fn(),
      simulateContract: vi.fn(),
      waitForTransactionReceipt: vi.fn(),
    })),
    useWalletClient: vi.fn(() => ({
      data: {
        writeContract: vi.fn(),
      },
    })),
    useBalance: vi.fn(() => ({
      data: { value: BigInt(1e18), formatted: '1.0', symbol: 'ETH' },
      isLoading: false,
    })),
  };
});

// ─────────────────────────────────────────────────────────────────────────────────
// REACT QUERY MOCKS
// ─────────────────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    })),
  };
});

// ─────────────────────────────────────────────────────────────────────────────────
// LIFECYCLE HOOKS
// ─────────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Setup that runs once before all tests
  console.log('🧪 Starting IGNIS test suite...');
});

afterEach(() => {
  // Cleanup after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup after all tests
  vi.restoreAllMocks();
  console.log('✅ Test suite completed');
});

// ─────────────────────────────────────────────────────────────────────────────────
// TEST UTILITIES
// ─────────────────────────────────────────────────────────────────────────────────

/**
 * Create a mock ERC20 token for testing
 */
export function createMockToken(overrides = {}) {
  return {
    address: '0x1234567890123456789012345678901234567890' as const,
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    balance: BigInt(1000e18),
    price: 1.0,
    ...overrides,
  };
}

/**
 * Create a mock pool for testing
 */
export function createMockPool(overrides = {}) {
  return {
    id: 1,
    token0: createMockToken({ symbol: 'ETH', name: 'Ethereum' }),
    token1: createMockToken({ symbol: 'USDC', name: 'USD Coin', decimals: 6 }),
    tvl: 1000000,
    volume24h: 500000,
    fees24h: 1500,
    apr: 12.5,
    type: 'Concentrated',
    fee: 3000,
    ...overrides,
  };
}

/**
 * Create a mock position for testing
 */
export function createMockPosition(overrides = {}) {
  return {
    id: 1,
    pool: createMockPool(),
    token0Amount: 1.5,
    token1Amount: 3000,
    minPrice: 1800,
    maxPrice: 2200,
    inRange: true,
    igniEarned: 25.5,
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random Ethereum address
 */
export function randomAddress(): `0x${string}` {
  const hex = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}` as `0x${string}`;
}

/**
 * Generate a random transaction hash
 */
export function randomTxHash(): `0x${string}` {
  const hex = [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}` as `0x${string}`;
}
