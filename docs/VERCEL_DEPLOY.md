# IGNIS: Deploy to Vercel from GitHub

Step-by-step guide to deploy IGNIS frontend to Vercel with automatic GitHub deployments.

---

## Quick Deploy (5 minutes)

### 1. Push to GitHub

```bash
cd ignis-combined
git init
git add .
git commit -m "IGNIS Protocol Frontend"
git remote add origin https://github.com/YOUR_USERNAME/ignis-frontend.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Log in with GitHub**
2. Click **"Add New..."** → **"Project"**
3. Select your `ignis-frontend` repository
4. Click **"Import"**

### 3. Deploy

1. Verify settings (auto-detected):
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. Click **"Deploy"**
3. Done! Your site is live at `https://ignis-frontend.vercel.app`

---

## Detailed Setup

### Prerequisites

- GitHub account
- Vercel account (free tier works)
- Node.js 18+ locally

### Step 1: Prepare Repository

**Initialize Git (if needed):**

```bash
cd ignis-combined

# Initialize
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: IGNIS Protocol Frontend"
```

**Create GitHub Repository:**

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `ignis-frontend`
3. Keep it **Private** or **Public**
4. Don't initialize with README (we already have files)
5. Click **Create repository**

**Push to GitHub:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/ignis-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Connect Vercel to GitHub

**First Time Setup:**

1. Go to [vercel.com](https://vercel.com)
2. Click **"Start Deploying"** or **"Sign Up"**
3. Select **"Continue with GitHub"**
4. Authorize Vercel to access GitHub
5. Grant access to your repositories

**Import Project:**

1. From Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Find `ignis-frontend` in the repository list
3. Click **"Import"**

**If repository not visible:**
- Click **"Adjust GitHub App Permissions"**
- Select the repository
- Save and return to Vercel

### Step 3: Configure Build Settings

Vercel auto-detects Vite. Verify these settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

**Node.js Version:**
- Go to Settings → General → Node.js Version
- Select **18.x** or **20.x**

### Step 4: Environment Variables (Optional)

IGNIS works in demo mode without env vars. For live blockchain:

1. Go to **Settings** → **Environment Variables**
2. Add:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_RPC_URL` | `https://bsc-dataseed.binance.org` | All |
| `VITE_CHAIN_ID` | `56` | All |
| `VITE_SUBGRAPH_URL` | Your subgraph URL | All |

**Important:** Variables must start with `VITE_` for Vite to expose them.

### Step 5: Deploy

1. Click **"Deploy"**
2. Watch the build logs
3. Wait ~30-60 seconds
4. Your site is live!

**Build Output:**

```
Cloning github.com/YOUR_USERNAME/ignis-frontend
Installing dependencies...
Running "npm run build"

> ignis@1.0.0 build
> tsc -b && vite build

✓ 1847 modules transformed.
dist/index.html                     1.23 kB │ gzip:  0.63 kB
dist/assets/index-DZl3pM9Y.js     506.62 kB │ gzip: 165.09 kB

✓ built in 29.12s

Deploying outputs...
✓ Production: https://ignis-frontend.vercel.app [32s]
```

---

## Automatic Deployments

Once connected, every push triggers a deploy:

| Event | Environment | URL |
|-------|-------------|-----|
| Push to `main` | Production | `your-project.vercel.app` |
| Push to other branches | Preview | `your-project-git-branch.vercel.app` |
| Pull Request opened | Preview | Unique URL, linked in PR |

### Preview Deployments

Each PR gets its own preview URL:
- `ignis-frontend-git-feature-xyz.vercel.app`
- Comments appear on GitHub PRs with preview links

### Branch Protection (Recommended)

In GitHub → Settings → Branches → Add rule:

1. Branch name pattern: `main`
2. Enable:
   - ✓ Require pull request reviews
   - ✓ Require status checks to pass (select Vercel)
   - ✓ Require branches to be up to date

---

## Custom Domain

### Add Domain in Vercel

1. Go to **Settings** → **Domains**
2. Enter: `app.ignis.finance`
3. Click **Add**

### Configure DNS

**For subdomain (app.ignis.finance):**

| Type | Name | Value |
|------|------|-------|
| CNAME | app | cname.vercel-dns.com |

**For apex domain (ignis.finance):**

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |

### SSL Certificate

Automatic! Vercel provisions Let's Encrypt SSL after DNS propagates (~5-10 min).

---

## vercel.json Configuration

Already included in project:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**What this does:**
- SPA routing: All routes → `index.html`
- Asset caching: 1 year for hashed files
- Security headers: XSS protection, clickjacking prevention

---

## Troubleshooting

### Build Fails: TypeScript Errors

```bash
# Test locally first
npm run typecheck
npm run build

# Fix errors, then push
git add .
git commit -m "Fix TypeScript errors"
git push
```

### Build Fails: Missing package-lock.json

```bash
# Commit the lock file
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### 404 on Page Refresh

Ensure `vercel.json` exists with rewrite rule:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

### Environment Variables Not Working

1. Must prefix with `VITE_`
2. Redeploy after adding (Settings → Deployments → Redeploy)
3. Check environment scope (Production/Preview/Development)

### Slow Builds

Use `npm ci` instead of `npm install`:

```json
{
  "installCommand": "npm ci"
}
```

---

## Deployment Checklist

Before pushing to production:

- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds locally
- [ ] `npm run preview` works (test the build)
- [ ] Environment variables set in Vercel
- [ ] Custom domain DNS configured
- [ ] SSL certificate active

---

## Rollback

To rollback to a previous deployment:

1. Go to **Deployments** tab
2. Find the previous working deployment
3. Click **"..."** → **"Promote to Production"**

---

## Monitoring

### Vercel Analytics

1. Go to **Analytics** tab
2. Enable **Web Vitals**
3. Optional: Add package for client-side analytics

```bash
npm install @vercel/analytics
```

```tsx
// main.tsx
import { Analytics } from '@vercel/analytics/react';

// Add to app
<Analytics />
```

### Build Notifications

1. **Settings** → **Integrations**
2. Add Slack or Discord webhook
3. Get notified on deploy success/failure

---

## CLI Deployment (Alternative)

Deploy without GitHub:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

---

## Quick Reference

| Task | Command/Location |
|------|------------------|
| Local build | `npm run build` |
| Local preview | `npm run preview` |
| Type check | `npm run typecheck` |
| Vercel Dashboard | vercel.com/dashboard |
| Project Settings | Project → Settings |
| Deployment Logs | Project → Deployments → [deployment] |
| Environment Vars | Project → Settings → Environment Variables |
| Domain Settings | Project → Settings → Domains |

---

## Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel + GitHub Integration](https://vercel.com/docs/deployments/git/vercel-for-github)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Custom Domains](https://vercel.com/docs/projects/domains)
