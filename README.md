# 🔥 IGNIS Protocol

**The Liquidity Layer for Yield-Bearing Assets**

IGNIS is the infrastructure protocol that makes vault tokens tradeable, liquid, and composable.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ignis-frontend)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

**No configuration required** — the app runs in demo mode with mock data.

---

## Features

- ⚡ **Instant Swaps** — Trade vault tokens with deep liquidity
- 📊 **Real-time Analytics** — TVL, volume, APR tracking
- 🗳️ **veIGNIS Governance** — Lock tokens for voting power
- 💧 **Liquidity Management** — Add/remove liquidity with preview
- 📈 **Market Depth** — Live order book visualization
- 🎨 **Professional UI** — Dark theme, WCAG 2.1 AA accessible

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Blockchain | wagmi + viem |
| Data | React Query |
| Charts | Recharts |
| Styling | CSS Modules |

---

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages (9 pages)
├── hooks/          # React hooks
├── services/       # API services
├── config/         # Configuration
├── styles/         # Global styles
├── types/          # TypeScript types
└── utils/          # Utilities
```

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run typecheck    # TypeScript check
npm run test:e2e     # E2E tests (Playwright)
```

---

## Environment Variables (Optional)

Create `.env` for live blockchain connection:

```bash
VITE_RPC_URL=https://bsc-dataseed.binance.org
VITE_CHAIN_ID=56
VITE_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/...
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

See `.env.example` for all options.

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repository → Deploy

That's it! See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for details.

---

## Documentation

| Document | Description |
|----------|-------------|
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Deployment guide |
| [BRAND_GUIDE.md](./BRAND_GUIDE.md) | Brand guidelines |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Contract integration |
| [IMPROVEMENTS.md](./IMPROVEMENTS.md) | Technical improvements |

---

## License

MIT
