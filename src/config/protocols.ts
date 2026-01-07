/** Module */

export const PRICE_SOURCES = {
  // Primary: DeFiLlama (free, no API key)
  defiLlama: {
    baseUrl: 'https://coins.llama.fi',
    endpoints: {
      prices: '/prices/current',
      historical: '/prices/historical',
      batch: '/prices',
    },
  },
  
  // Fallback: CoinGecko (free tier has rate limits)
  coinGecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      prices: '/simple/price',
      tokenPrice: '/simple/token_price',
      historical: '/coins/{id}/market_chart',
    },
  },
  
  // Alternative: DexScreener (for DEX prices)
  dexScreener: {
    baseUrl: 'https://api.dexscreener.com/latest',
    endpoints: {
      pairs: '/dex/pairs',
      tokens: '/dex/tokens',
    },
  },
};

export const YIELD_PROTOCOLS = {
  // Aave V3
  aave: {
    name: 'Aave',
    baseUrl: 'https://aave-api-v2.aave.com',
    endpoints: {
      reserves: '/data/liquidity/v2',
      markets: '/data/markets',
    },
    // Alternative: Use DeFiLlama yields API
    defiLlamaPool: 'aave-v3',
  },
  
  // Morpho (Blue)
  morpho: {
    name: 'Morpho',
    baseUrl: 'https://blue-api.morpho.org/graphql',
    // GraphQL endpoint
    defiLlamaPool: 'morpho-blue',
  },
  
  // Lido
  lido: {
    name: 'Lido',
    baseUrl: 'https://eth-api.lido.fi',
    endpoints: {
      apr: '/v1/protocol/steth/apr/sma',
      stats: '/v1/protocol/steth/stats',
    },
    defiLlamaPool: 'lido',
  },
  
  // Rocket Pool
  rocketPool: {
    name: 'Rocket Pool',
    baseUrl: 'https://api.rocketpool.net',
    endpoints: {
      stats: '/api/mainnet/payload',
    },
    defiLlamaPool: 'rocket-pool',
  },
  
  // Coinbase (cbETH)
  coinbase: {
    name: 'Coinbase',
    // cbETH yield is derived from staking rewards
    defiLlamaPool: 'coinbase-wrapped-staked-eth',
  },
  
  // Spark (sDAI)
  spark: {
    name: 'Spark',
    baseUrl: 'https://spark-api.blockanalitica.com',
    defiLlamaPool: 'spark-sdai',
  },
  
  // Compound
  compound: {
    name: 'Compound',
    baseUrl: 'https://api.compound.finance',
    endpoints: {
      ctoken: '/api/v2/ctoken',
    },
    defiLlamaPool: 'compound-v3',
  },
  
  // Yearn
  yearn: {
    name: 'Yearn',
    baseUrl: 'https://api.yearn.fi/v1/chains/1/vaults/all',
    defiLlamaPool: 'yearn-finance',
  },
  
  // EtherFi (weETH)
  etherfi: {
    name: 'EtherFi',
    defiLlamaPool: 'ether.fi-liquid',
  },
  
  // Dinero/Pirex (apxETH)
  dinero: {
    name: 'Dinero',
    defiLlamaPool: 'dinero-pxeth',
  },
  
  // Euler
  euler: {
    name: 'Euler',
    defiLlamaPool: 'euler',
  },
  
  // Fluid
  fluid: {
    name: 'Fluid',
    defiLlamaPool: 'fluid-dex',
  },
};

export const DEFILLAMA_YIELDS = {
  baseUrl: 'https://yields.llama.fi',
  endpoints: {
    pools: '/pools',
    chart: '/chart',
  },
};

// CoinGecko token IDs
export const COINGECKO_IDS = {
  ETH: 'ethereum',
  WETH: 'weth',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WBTC: 'wrapped-bitcoin',
  stETH: 'staked-ether',
  wstETH: 'wrapped-steth',
  rETH: 'rocket-pool-eth',
  cbETH: 'coinbase-wrapped-staked-eth',
  sDAI: 'savings-dai',
  weETH: 'wrapped-eeth',
  IGNI: null, // Not on CoinGecko yet
};

// DeFiLlama chain:address format
export const DEFILLAMA_IDS = {
  // Base mainnet
  base: {
    WETH: 'base:0x4200000000000000000000000000000000000006',
    USDC: 'base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: 'base:0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    DAI: 'base:0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    cbETH: 'base:0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
    wstETH: 'base:0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
  },
  // Ethereum mainnet (for reference prices)
  ethereum: {
    WETH: 'ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: 'ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    stETH: 'ethereum:0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    wstETH: 'ethereum:0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    rETH: 'ethereum:0xae78736Cd615f374D3085123A210448E74Fc6393',
    cbETH: 'ethereum:0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    sDAI: 'ethereum:0x83F20F44975D03b1b09e64809B757c47f942BEeA',
    weETH: 'ethereum:0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
  },
};

export const VAULT_PROTOCOLS = {
  // Symbol -> Protocol key
  aUSDC: 'aave',
  aUSDT: 'aave',
  aDAI: 'aave',
  aWETH: 'aave',
  mUSDC: 'morpho',
  mDAI: 'morpho',
  mWETH: 'morpho',
  stETH: 'lido',
  wstETH: 'lido',
  rETH: 'rocketPool',
  cbETH: 'coinbase',
  sDAI: 'spark',
  cUSDC: 'compound',
  cUSDT: 'compound',
  cDAI: 'compound',
  yUSDC: 'yearn',
  yDAI: 'yearn',
  weETH: 'etherfi',
  apxETH: 'dinero',
  eUSDC: 'euler',
  eETH: 'euler',
  fUSDC: 'fluid',
  fETH: 'fluid',
};

export const CACHE_CONFIG = {
  // How long to cache prices (5 minutes)
  pricesTTL: 5 * 60 * 1000,
  
  // How long to cache vault yields (15 minutes - yields don't change fast)
  yieldsTTL: 15 * 60 * 1000,
  
  // How long to cache APR calculations (5 minutes)
  aprTTL: 5 * 60 * 1000,
  
  // How long to cache historical data (1 hour)
  historicalTTL: 60 * 60 * 1000,
  
  // LocalStorage keys
  keys: {
    prices: 'ignis_prices_cache',
    yields: 'ignis_yields_cache',
    apr: 'ignis_apr_cache',
    historical: 'ignis_historical_cache',
  },
};

// Fallback yields when API fails (conservative estimates)
export const FALLBACK_YIELDS = {
  aave: { USDC: 4.2, USDT: 4.0, DAI: 3.8, WETH: 2.1 },
  morpho: { USDC: 5.5, DAI: 5.2, WETH: 3.2 },
  lido: { stETH: 3.4, wstETH: 3.4 },
  rocketPool: { rETH: 3.1 },
  coinbase: { cbETH: 3.0 },
  spark: { sDAI: 5.0 },
  compound: { USDC: 3.5, USDT: 3.3, DAI: 3.2 },
  yearn: { USDC: 6.0, DAI: 5.8 },
  etherfi: { weETH: 3.5 },
  dinero: { apxETH: 4.0 },
  euler: { USDC: 4.5, ETH: 2.5 },
  fluid: { USDC: 5.0, ETH: 3.0 },
};

// Fallback prices when API fails
export const FALLBACK_PRICES = {
  ETH: 3850,
  WETH: 3850,
  USDC: 1,
  USDT: 1,
  DAI: 1,
  WBTC: 105000,
  stETH: 3845,
  wstETH: 4480,
  rETH: 4120,
  cbETH: 4050,
  sDAI: 1.05,
  weETH: 4020,
  apxETH: 3980,
  ARB: 1.85,
  IGNI: 0.15, // Placeholder
};
