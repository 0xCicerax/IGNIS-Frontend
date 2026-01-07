# IGNIS DEX — Mainnet Readiness Checklist

> **Current Status:** 7.5/10 — Demo Ready, Not Mainnet Ready  
> **Target:** 9.5/10 — Production Mainnet Ready  
> **Estimated Effort:** 2-3 weeks

---

## 🔴 BLOCKERS (Must Fix Before Mainnet)

### 1. Subgraph Deployment & Integration
- [ ] Deploy IGNIS subgraph to The Graph (hosted or decentralized)
- [ ] Update `src/graphql/client.ts` with real subgraph URLs
- [ ] Test all GraphQL queries against deployed subgraph
- [ ] Remove/replace all MOCK_ data fallbacks
- [ ] Verify data freshness and indexing speed

**Files to update:**
```
src/graphql/client.ts          # Subgraph URLs
src/hooks/subgraph/usePools.ts # Remove MOCK_CL_POOLS, MOCK_BIN_POOLS
src/hooks/subgraph/useUser.ts  # Remove MOCK_USER, MOCK_STAKER_POSITIONS
src/hooks/subgraph/useTokens.ts
src/hooks/subgraph/useVaults.ts
src/hooks/subgraph/useProtocolStats.ts
src/hooks/subgraph/useStakingAndSwaps.ts
```

**Verification:**
```bash
# Test subgraph is responding
curl -X POST https://api.thegraph.com/subgraphs/name/YOUR_NAME/ignis-base \
  -H "Content-Type: application/json" \
  -d '{"query": "{ protocols(first: 1) { id totalVolumeUSD } }"}'
```

---

### 2. Contract Address Verification
- [ ] Get all deployed contract addresses from deployment team
- [ ] Verify each address on block explorer (Basescan)
- [ ] Confirm ABI matches deployed bytecode
- [ ] Update `src/lib/contracts/addresses.ts`
- [ ] Test read calls to each contract

**Addresses needed:**
| Contract | Base Mainnet | Base Sepolia |
|----------|--------------|--------------|
| GatewayRouterV5 | `0x...` | `0x...` |
| AureliaSmartQuoterV5 | `0x...` | `0x...` |
| Gateway4626Buffer | `0x...` | `0x...` |
| GatewayRegistry | `0x...` | `0x...` |
| TokenRegistryV2 | `0x...` | `0x...` |
| PoolRegistry | `0x...` | `0x...` |
| GatewayKeeper | `0x...` | `0x...` |
| BufferStakerV2 | `0x...` | `0x...` |
| CLPoolManager | `0x...` | `0x...` |
| BinPoolManager | `0x...` | `0x...` |

**Verification script:**
```typescript
// scripts/verify-contracts.ts
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CONTRACTS = {
  gatewayRouter: '0x...',
  // ... all addresses
};

async function verify() {
  const client = createPublicClient({ chain: base, transport: http() });
  
  for (const [name, address] of Object.entries(CONTRACTS)) {
    const code = await client.getBytecode({ address });
    console.log(`${name}: ${code ? '✅ Deployed' : '❌ No code'}`);
  }
}
```

---

### 3. WalletConnect Setup
- [ ] Create project at https://cloud.walletconnect.com
- [ ] Get production project ID
- [ ] Add to environment variables
- [ ] Test wallet connections (MetaMask, Coinbase, WalletConnect)
- [ ] Verify on mobile devices

**Environment:**
```bash
# .env.production
VITE_WALLETCONNECT_PROJECT_ID=your_32_char_hex_id_here
```

---

### 4. Security Audit
- [ ] External audit of transaction signing flows
- [ ] Review slippage protection implementation
- [ ] Audit deadline handling
- [ ] Check for reentrancy in multicall patterns
- [ ] Verify approval flows (infinite vs exact)
- [ ] Test with malicious token contracts (fee-on-transfer, etc.)

**Critical flows to audit:**
1. `useSwap.ts` - executeSwap function
2. `useBuffer.ts` - wrap/unwrap functions
3. `useStaking.ts` - stake/unstake functions
4. Approval flow in `useToken.ts`

---

## 🟡 IMPORTANT (Should Fix Before Mainnet)

### 5. Remove Development Artifacts
- [ ] Remove all `console.log` statements (54 found)
- [ ] Remove or address all TODO/FIXME comments (16 found)
- [ ] Remove mock data files or mark clearly as test-only
- [ ] Audit for hardcoded test values

**Find and fix:**
```bash
# Console logs
grep -rn "console\." src --include="*.ts" --include="*.tsx" | grep -v logger

# TODOs
grep -rn "TODO\|FIXME" src --include="*.ts" --include="*.tsx"

# Hardcoded addresses
grep -rn "0x[a-fA-F0-9]\{40\}" src --include="*.ts" --include="*.tsx"
```

---

### 6. Error Handling Hardening
- [ ] Add retry logic for failed RPC calls
- [ ] Handle chain switching errors gracefully
- [ ] Add fallback RPC providers
- [ ] Improve error messages for common failures
- [ ] Add transaction replacement (speed up / cancel)

**Example retry wrapper:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 7. Performance Optimization
- [ ] Implement query deduplication
- [ ] Add request batching for multiple contract reads
- [ ] Optimize re-renders with React.memo
- [ ] Add virtual scrolling for long lists
- [ ] Implement proper cache invalidation

---

### 8. Monitoring & Alerting
- [ ] Set up Sentry project and add DSN
- [ ] Configure error alerting thresholds
- [ ] Add performance monitoring
- [ ] Set up uptime monitoring
- [ ] Create runbook for common issues

**Sentry setup:**
```bash
# .env.production
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
```

---

## 🟢 NICE TO HAVE (Can Do After Launch)

### 9. E2E Tests
- [ ] Set up Playwright or Cypress
- [ ] Test swap flow end-to-end
- [ ] Test liquidity provision flow
- [ ] Test staking flow
- [ ] Add visual regression tests

### 10. Analytics
- [ ] Integrate analytics (Amplitude, Mixpanel, etc.)
- [ ] Track key user actions
- [ ] Set up conversion funnels
- [ ] A/B testing infrastructure

### 11. Internationalization
- [ ] Extract all strings to i18n files
- [ ] Add language selector
- [ ] Support RTL languages

### 12. Accessibility Audit
- [ ] Full WCAG 2.1 AA compliance check
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Color contrast verification

---

## Pre-Launch Verification

### Final Checklist (Day Before Launch)

```
□ All environment variables set in production
□ Sentry receiving test errors
□ WalletConnect working on all target wallets
□ Subgraph fully indexed and responding
□ All contract addresses verified on block explorer
□ DNS configured and SSL certificates valid
□ CDN caching configured correctly
□ Rate limiting in place
□ Backup RPC endpoints configured
□ Team has access to monitoring dashboards
□ Incident response plan documented
□ Rollback procedure tested
```

### Launch Day Monitoring

```
□ Monitor error rates in Sentry
□ Watch transaction success rates
□ Check subgraph indexing lag
□ Monitor RPC response times
□ Track user complaints in Discord/support
□ Have team on standby for 24 hours
```

---

## Deployment Environments

| Environment | Purpose | Subgraph | Contracts |
|-------------|---------|----------|-----------|
| Development | Local dev | Mock data | Mock/Testnet |
| Staging | QA testing | Base Sepolia | Testnet |
| Production | Live users | Base Mainnet | Mainnet |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Subgraph goes down | Medium | High | Fallback to direct RPC reads |
| RPC rate limiting | High | Medium | Multiple RPC providers |
| Contract bug | Low | Critical | Audit + pausability |
| Frontend bug | Medium | Medium | Error boundaries + rollback |
| Wallet compat issues | Medium | Low | Test on all major wallets |

---

## Sign-Off Requirements

Before mainnet launch, get sign-off from:

- [ ] **Engineering Lead** - Code review complete
- [ ] **Security** - Audit passed, no critical issues
- [ ] **Product** - All features working as specified
- [ ] **Legal** - Terms of service, disclaimers in place
- [ ] **Ops** - Monitoring and alerting configured

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Subgraph deployment | 2-3 days | Contract addresses |
| Frontend integration | 2-3 days | Subgraph live |
| WalletConnect setup | 1 day | None |
| Security review | 5-7 days | Code freeze |
| Staging testing | 3-5 days | All above |
| Production deploy | 1 day | Sign-offs |

**Total: 2-3 weeks**

---

## Contact / Escalation

| Role | Contact | Escalate To |
|------|---------|-------------|
| Frontend Issues | [Frontend Lead] | [Engineering Lead] |
| Contract Issues | [Smart Contract Lead] | [CTO] |
| Subgraph Issues | [Backend Lead] | [Engineering Lead] |
| Security Issues | [Security Lead] | [CTO] |
