/** GraphQL queries */
// ─────────────────────────────────────────────────────────────────────────────────
// PROTOCOL STATISTICS
// ─────────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_STATS_QUERY = `
  query ProtocolStats {
    protocol(id: "aurelia") {
      id
      totalVolumeUSD
      totalSwaps
      totalWraps
      totalUnwraps
      totalUsers
      totalVaults
      totalGasSaved
      totalStaked
      totalRewardsDistributed
      createdAt
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const TOKENS_QUERY = `
  query Tokens($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String) {
    tokens(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { allowed: true }
    ) {
      id
      symbol
      name
      decimals
      allowed
      isVaultToken
      underlyingToken {
        id
        symbol
        name
        decimals
      }
      totalVolume
      totalVolumeUSD
      swapCount
    }
  }
`;

export const TOKEN_QUERY = `
  query Token($id: ID!) {
    token(id: $id) {
      id
      symbol
      name
      decimals
      allowed
      isVaultToken
      underlyingToken {
        id
        symbol
        name
        decimals
      }
      totalVolume
      totalVolumeUSD
      swapCount
    }
  }
`;

export const VAULT_TOKENS_QUERY = `
  query VaultTokens {
    tokens(where: { isVaultToken: true, allowed: true }) {
      id
      symbol
      name
      decimals
      underlyingToken {
        id
        symbol
        decimals
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// VAULT QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const VAULTS_QUERY = `
  query Vaults($first: Int!, $skip: Int!) {
    vaults(
      first: $first
      skip: $skip
      where: { enabled: true }
      orderBy: totalAssetsDeposited
      orderDirection: desc
    ) {
      id
      vaultToken {
        id
        symbol
        name
        decimals
      }
      underlying {
        id
        symbol
        name
        decimals
      }
      name
      symbol
      decimals
      enabled
      isPrimary
      gateway
      maxWrapPerTx
      maxUnwrapPerTx
      totalAssetsDeposited
      totalSharesMinted
      totalAssetsWithdrawn
      totalSharesBurned
      exchangeRate
      disabledAt
      createdAt
      updatedAt
      bufferState {
        id
        underlyingBalance
        sharesBalance
        targetUnderlying
        targetShares
        totalWraps
        totalUnwraps
        bufferHitRate
        missRate
        gasSaved
        lastRebalance
      }
    }
  }
`;

export const VAULT_QUERY = `
  query Vault($id: ID!) {
    vault(id: $id) {
      id
      vaultToken {
        id
        symbol
        name
        decimals
      }
      underlying {
        id
        symbol
        name
        decimals
      }
      name
      symbol
      decimals
      enabled
      isPrimary
      gateway
      maxWrapPerTx
      maxUnwrapPerTx
      totalAssetsDeposited
      totalSharesMinted
      totalAssetsWithdrawn
      totalSharesBurned
      exchangeRate
      disabledAt
      createdAt
      updatedAt
      bufferState {
        id
        underlyingBalance
        sharesBalance
        targetUnderlying
        targetShares
        totalWraps
        totalUnwraps
        bufferHitRate
        missRate
        gasSaved
        lastRebalance
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// BUFFER STATE QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const BUFFER_STATES_QUERY = `
  query BufferStates {
    bufferStates(first: 100) {
      id
      vault {
        id
        symbol
        underlying {
          id
          symbol
        }
      }
      underlyingBalance
      sharesBalance
      targetUnderlying
      targetShares
      totalWraps
      totalUnwraps
      bufferHitRate
      missRate
      gasSaved
      lastRebalance
      updatedAt
    }
  }
`;

export const BUFFER_STATE_QUERY = `
  query BufferState($vaultId: ID!) {
    bufferState(id: $vaultId) {
      id
      vault {
        id
        symbol
      }
      underlyingBalance
      sharesBalance
      targetUnderlying
      targetShares
      totalWraps
      totalUnwraps
      bufferHitRate
      missRate
      gasSaved
      lastRebalance
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// POOL QUERIES (CL + BIN)
// ─────────────────────────────────────────────────────────────────────────────────

export const CL_POOLS_QUERY = `
  query CLPools($first: Int!, $skip: Int!, $registered: Boolean) {
    clpools(
      first: $first
      skip: $skip
      where: { isRegistered: $registered }
      orderBy: liquidity
      orderDirection: desc
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
        isVaultToken
      }
      token1 {
        id
        symbol
        name
        decimals
        isVaultToken
      }
      fee
      tickSpacing
      hooks
      sqrtPriceX96
      tick
      liquidity
      isRegistered
      registeredAt
      lastRegistryUpdate
      createdAtBlock
      createdAt
    }
  }
`;

export const BIN_POOLS_QUERY = `
  query BinPools($first: Int!, $skip: Int!, $registered: Boolean) {
    binPools(
      first: $first
      skip: $skip
      where: { isRegistered: $registered }
      orderBy: reserveX
      orderDirection: desc
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
        isVaultToken
      }
      token1 {
        id
        symbol
        name
        decimals
        isVaultToken
      }
      binStep
      hooks
      activeId
      reserveX
      reserveY
      isRegistered
      registeredAt
      lastRegistryUpdate
      createdAtBlock
      createdAt
    }
  }
`;

export const ALL_POOLS_QUERY = `
  query AllPools($first: Int!, $registered: Boolean) {
    clpools(
      first: $first
      where: { isRegistered: $registered }
      orderBy: liquidity
      orderDirection: desc
    ) {
      id
      token0 { id symbol decimals isVaultToken }
      token1 { id symbol decimals isVaultToken }
      fee
      tickSpacing
      sqrtPriceX96
      tick
      liquidity
      isRegistered
      createdAt
    }
    binPools(
      first: $first
      where: { isRegistered: $registered }
      orderBy: reserveX
      orderDirection: desc
    ) {
      id
      token0 { id symbol decimals isVaultToken }
      token1 { id symbol decimals isVaultToken }
      binStep
      activeId
      reserveX
      reserveY
      isRegistered
      createdAt
    }
  }
`;

export const POOL_REGISTRY_STATS_QUERY = `
  query PoolRegistryStats {
    poolRegistryStats(id: "pool-registry") {
      id
      totalCLPoolsRegistered
      totalBinPoolsRegistered
      lastSyncAt
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// SWAP QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const RECENT_SWAPS_QUERY = `
  query RecentSwaps($first: Int!, $skip: Int!) {
    swaps(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      sender
      recipient
      tokenIn {
        id
        symbol
        decimals
      }
      tokenOut {
        id
        symbol
        decimals
      }
      amountIn
      amountOut
      amountUSD
      priceImpact
      route
      gasUsed
      gasSaved
      usedBuffer
    }
  }
`;

export const USER_SWAPS_QUERY = `
  query UserSwaps($user: Bytes!, $first: Int!, $skip: Int!) {
    swaps(
      first: $first
      skip: $skip
      where: { sender: $user }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      tokenIn {
        id
        symbol
        decimals
      }
      tokenOut {
        id
        symbol
        decimals
      }
      amountIn
      amountOut
      amountUSD
      priceImpact
      usedBuffer
    }
  }
`;

export const POOL_SWAPS_QUERY = `
  query PoolSwaps($poolId: String!, $first: Int!) {
    swaps(
      first: $first
      where: { pool: $poolId }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      sender
      tokenIn { id symbol }
      tokenOut { id symbol }
      amountIn
      amountOut
      amountUSD
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// USER QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const USER_QUERY = `
  query User($id: ID!) {
    user(id: $id) {
      id
      totalSwaps
      totalVolumeUSD
      totalGasSaved
      firstInteraction
      lastInteraction
    }
  }
`;

export const USER_STATS_QUERY = `
  query UserStats($userId: ID!) {
    user(id: $userId) {
      id
      totalSwaps
      totalVolumeUSD
      totalGasSaved
      firstInteraction
      lastInteraction
    }
    stakerPositions(where: { user: $userId }) {
      id
      underlying {
        id
        symbol
        decimals
      }
      stakingPool {
        id
        rewardToken { symbol }
        rewardRate
      }
      depositedAmount
      pendingRewards
      totalClaimed
      lastUpdate
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// STAKING QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const STAKING_POOLS_QUERY = `
  query StakingPools {
    stakingPools(first: 100) {
      id
      underlying {
        id
        symbol
        name
        decimals
      }
      rewardToken {
        id
        symbol
        decimals
      }
      totalStaked
      rewardRate
      totalRewardsDistributed
      stakerCount
      createdAt
      updatedAt
    }
  }
`;

export const STAKING_POOL_QUERY = `
  query StakingPool($id: ID!) {
    stakingPool(id: $id) {
      id
      underlying {
        id
        symbol
        name
        decimals
      }
      rewardToken {
        id
        symbol
        decimals
      }
      totalStaked
      rewardRate
      totalRewardsDistributed
      stakerCount
      createdAt
      updatedAt
    }
  }
`;

export const USER_STAKER_POSITIONS_QUERY = `
  query UserStakerPositions($user: Bytes!) {
    stakerPositions(where: { user: $user }) {
      id
      user {
        id
      }
      underlying {
        id
        symbol
        decimals
      }
      stakingPool {
        id
        rewardToken { id symbol }
        rewardRate
        totalStaked
      }
      depositedAmount
      pendingRewards
      totalClaimed
      lastUpdate
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// WRAP/UNWRAP EVENT QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const RECENT_WRAP_EVENTS_QUERY = `
  query RecentWrapEvents($first: Int!) {
    wrapEvents(
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      user { id }
      vault { id symbol }
      underlyingAmount
      sharesReceived
      usedBuffer
      gasSaved
    }
  }
`;

export const RECENT_UNWRAP_EVENTS_QUERY = `
  query RecentUnwrapEvents($first: Int!) {
    unwrapEvents(
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      user { id }
      vault { id symbol }
      sharesBurned
      underlyingReceived
      usedBuffer
      gasSaved
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// AGGREGATOR QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const AGGREGATOR_SWAPS_QUERY = `
  query AggregatorSwaps($first: Int!, $skip: Int!) {
    aggregatorSwaps(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      txHash
      timestamp
      sender
      recipient
      tokenIn { id symbol }
      tokenOut { id symbol }
      amountIn
      amountOut
      aggregatorSource
    }
  }
`;

export const AGGREGATOR_STATS_QUERY = `
  query AggregatorStats {
    aggregatorSwaps(first: 1000) {
      aggregatorSource
      amountIn
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// GATEWAY POLICY QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const GATEWAY_POLICIES_QUERY = `
  query GatewayPolicies {
    gatewayPolicies(first: 100) {
      id
      gateway
      maxWrapPerTx
      maxUnwrapPerTx
      updatedAt
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// SEARCH QUERIES
// ─────────────────────────────────────────────────────────────────────────────────

export const SEARCH_TOKENS_QUERY = `
  query SearchTokens($search: String!) {
    tokens(
      first: 10
      where: { 
        or: [
          { symbol_contains_nocase: $search },
          { name_contains_nocase: $search }
        ]
      }
    ) {
      id
      symbol
      name
      decimals
      isVaultToken
    }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────────
// TIME SERIES QUERIES (for charts)
// ─────────────────────────────────────────────────────────────────────────────────

export const PROTOCOL_DAY_DATA_QUERY = `
  query ProtocolDayData($first: Int!) {
    protocolDayDatas(
      first: $first
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      volumeUSD
      tvlUSD
      feesUSD
      txCount
      uniqueUsers
    }
  }
`;

export const VAULT_DAY_DATA_QUERY = `
  query VaultDayData($vaultId: String!, $first: Int!) {
    vaultDayDatas(
      first: $first
      where: { vault: $vaultId }
      orderBy: date
      orderDirection: desc
    ) {
      id
      date
      totalAssets
      totalShares
      exchangeRate
      depositsUSD
      withdrawalsUSD
    }
  }
`;
