export const PLATFORMS = [
  'All',
  'Aave',
  'Compound',
  'Lido',
  'Rocket Pool',
  'Coinbase',
  'Spark',
  'Yearn',
  'Morpho',
] as const;

export type Platform = typeof PLATFORMS[number];
