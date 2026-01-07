# IGNIS DEX - Security Guidelines

This document outlines security considerations and recommended configurations for deploying IGNIS DEX in production.

## 1. Environment Variables

### Required for Production
```env
VITE_WALLETCONNECT_PROJECT_ID=<your-project-id>
VITE_SUBGRAPH_URL_BASE=<your-subgraph-url>
```

### Never Commit
- `.env.local`
- `.env.production`
- Any file containing API keys or secrets

## 2. HTTP Security Headers

Configure these headers on your hosting platform (Vercel, Cloudflare, nginx, etc.):

### Content Security Policy (CSP)
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.walletconnect.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' 
    https://*.walletconnect.com 
    wss://*.walletconnect.com 
    https://*.infura.io 
    https://*.alchemy.com
    https://mainnet.base.org
    https://eth.llamarpc.com
    https://api.coingecko.com
    https://api.llama.fi;
  frame-src 'self' https://verify.walletconnect.com;
  frame-ancestors 'none';
```

### Other Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Vercel Configuration (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

### Cloudflare Workers
```javascript
async function handleRequest(request) {
  const response = await fetch(request);
  const newHeaders = new Headers(response.headers);
  
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
```

## 3. Domain Security

### DNS Configuration
- Use DNSSEC if available
- Configure CAA records to limit certificate issuance
- Set up SPF, DKIM, and DMARC for any email services

### SSL/TLS
- Use TLS 1.3 only (disable 1.0, 1.1, 1.2 if possible)
- Enable HSTS with preload
- Use strong cipher suites

## 4. Contract Address Verification

Before deployment, verify all contract addresses:

```typescript
// src/lib/contracts/addresses.ts
export const VERIFIED_CONTRACTS = {
  mainnet: {
    gatewayRouter: '0x...',  // Verify on Etherscan
    quoter: '0x...',         // Verify on Etherscan
  },
  base: {
    gatewayRouter: '0x...',  // Verify on Basescan
    quoter: '0x...',         // Verify on Basescan
  },
};
```

Checklist:
- [ ] All addresses verified on block explorer
- [ ] Contract source code verified and matches expected
- [ ] No proxy contracts pointing to unexpected implementations
- [ ] Admin keys secured (multisig, timelock)

## 5. Dependency Security

### Regular Audits
```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# For manual review
npm audit --json > audit.json
```

### Lock File
- Always commit `package-lock.json`
- Use `npm ci` in CI/CD (not `npm install`)

### Dependency Updates
- Review changelogs before updating
- Test thoroughly after updates
- Pay special attention to:
  - `wagmi` / `viem` (wallet interaction)
  - `@tanstack/react-query` (data fetching)
  - Any Web3 libraries

## 6. Build Security

### Source Maps
- Disabled in production (`vite.config.ts`)
- If needed for error tracking, use hidden source maps uploaded to Sentry

### Environment Variables
- All validated at startup (`src/config/env.ts`)
- Fail fast with clear errors if misconfigured

## 7. Monitoring

### Error Tracking
```typescript
// Example Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});
```

### Recommended Alerts
- JavaScript errors spike
- API errors (subgraph, RPC)
- Transaction failures
- Unusual traffic patterns

## 8. Incident Response

### If Compromised
1. **Immediately**: Pause frontend (maintenance mode)
2. **Investigate**: Check for malicious code injection
3. **Notify**: Inform users if funds at risk
4. **Remediate**: Fix vulnerability, rotate secrets
5. **Post-mortem**: Document and improve

### Contact
- Security issues: security@aurelia.finance
- Bug bounty: https://immunefi.com/bounty/aurelia

## 9. Checklist Before Launch

- [ ] All environment variables documented and validated
- [ ] Security headers configured on hosting
- [ ] Source maps disabled or secured
- [ ] Contract addresses verified
- [ ] Dependencies audited
- [ ] Error tracking configured
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS properly configured
- [ ] No console.logs with sensitive data
- [ ] SSL/HTTPS enforced
- [ ] DNS security configured
