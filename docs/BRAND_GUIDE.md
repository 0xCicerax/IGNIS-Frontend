# IGNIS Protocol Brand Guide

The definitive brand reference for IGNIS — The Liquidity Layer for Yield-Bearing Assets.

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Logo](#logo)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Components](#components)
7. [Iconography](#iconography)
8. [Motion & Animation](#motion--animation)
9. [Voice & Tone](#voice--tone)
10. [Usage Examples](#usage-examples)

---

## Brand Overview

### Brand Essence

**IGNIS** (Latin for "fire") represents transformation, energy, and the burning potential of yield-bearing assets. The protocol transforms static vault tokens into liquid, tradeable, composable DeFi primitives.

### Tagline

> **"The Liquidity Layer for Yield-Bearing Assets"**

### Secondary Taglines

- "ERC-4626 Yield Infrastructure"
- "Powering the next generation of yield-bearing asset markets"
- "Complete infrastructure for vault tokens"

### Brand Attributes

| Attribute | Expression |
|-----------|------------|
| **Professional** | Clean dark UI, precise typography, minimal decoration |
| **Powerful** | Gold/fire gradients, bold headlines, strong CTAs |
| **Trustworthy** | Consistent design system, clear information hierarchy |
| **Innovative** | Modern stack, cutting-edge DeFi features |

---

## Logo

### Primary Logo

The IGNIS logo consists of two elements:
1. **Flame Icon** — Gradient-filled flame symbolizing transformation
2. **Wordmark** — "IGNIS" in gradient text

```
┌─────────────────────────┐
│  🔥  IGNIS              │
│  ↑     ↑                │
│ Icon  Wordmark          │
└─────────────────────────┘
```

### Flame Icon SVG

```svg
<svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <defs>
        <linearGradient id="flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ea580c"/>
            <stop offset="50%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
    </defs>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#flame-grad)"/>
</svg>
```

### Logo Container (with background)

```css
.logo-container {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, rgba(245,176,65,0.15), rgba(239,68,68,0.1));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

### Logo Usage Rules

| ✓ Do | ✗ Don't |
|------|---------|
| Use on dark backgrounds | Use on light backgrounds without modification |
| Maintain aspect ratio | Stretch or distort |
| Use approved gradients | Use solid colors for icon |
| Keep minimum clear space | Crowd with other elements |

### Minimum Sizes

- **Icon only:** 24px minimum
- **Full logo:** 120px minimum width
- **Favicon:** 16px, 32px, 192px, 512px

---

## Color System

### Primary Palette

#### Gold (Brand Primary)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Gold** | `#F5B041` | rgb(245, 176, 65) | Primary accent, CTAs, highlights |
| **Gold Dark** | `#D4941C` | rgb(212, 148, 28) | Gradient end, hover states |

```css
--color-gold: #F5B041;
--color-gold-dark: #D4941C;
--color-gold-gradient: linear-gradient(135deg, #F5B041, #D4941C);
```

#### Fire Gradient (Hero/Headers)

```css
--color-fire-gradient: linear-gradient(135deg, #EF4444, #F97316, #F5B041);
```

Used for: Hero titles, important headings, "ve" prefix styling

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22C55E` | Positive values, confirmations, gains |
| **Success Light** | `#4ADE80` | Success hover states |
| **Warning** | `#F59E0B` | Warnings, caution states |
| **Error** | `#EF4444` | Errors, negative values, losses |
| **Info** | `#3B82F6` | Informational elements |
| **Purple** | `#A855F7` | veIGNIS, voting power, special features |
| **Purple Light** | `#A78BFA` | Purple hover/secondary |

### Background Colors

| Name | Value | Usage |
|------|-------|-------|
| **Primary BG** | `#0A0A0B` | Page background |
| **Card BG** | `rgba(25, 25, 28, 1)` | Card backgrounds |
| **Card End** | `rgba(18, 18, 20, 1)` | Card gradient end |
| **Input BG** | `rgba(255, 255, 255, 0.02)` | Input fields |
| **Hover BG** | `rgba(255, 255, 255, 0.03)` | Hover states |
| **Button BG** | `rgba(255, 255, 255, 0.06)` | Secondary buttons |

```css
--color-bg-card-gradient: linear-gradient(180deg, rgba(25,25,28,1) 0%, rgba(18,18,20,1) 100%);
```

### Text Colors

| Name | Hex | Contrast | Usage |
|------|-----|----------|-------|
| **Primary** | `#FFFFFF` | 19.79:1 | Headlines, important text |
| **Secondary** | `#A3A3A3` | 7.85:1 | Body text, descriptions |
| **Muted** | `#8A8A8A` | 5.73:1 | Labels, captions |
| **Disabled** | `#7A7A7A` | 4.61:1 | Disabled states, placeholders |

All text colors meet **WCAG 2.1 AA** requirements (4.5:1 minimum).

### Border Colors

| Name | Value | Usage |
|------|-------|-------|
| **Border** | `rgba(255, 255, 255, 0.06)` | Card borders |
| **Border Light** | `rgba(255, 255, 255, 0.04)` | Subtle dividers |
| **Border Lighter** | `rgba(255, 255, 255, 0.03)` | Very subtle borders |
| **Border Input** | `rgba(255, 255, 255, 0.1)` | Input borders |

### Color Application

```
┌─────────────────────────────────────────────────────┐
│ #0A0A0B (Primary BG)                                │
│  ┌───────────────────────────────────────────────┐  │
│  │ Card BG Gradient                              │  │
│  │ rgba(25,25,28) → rgba(18,18,20)               │  │
│  │                                               │  │
│  │  #FFFFFF  Primary Title                       │  │
│  │  #A3A3A3  Secondary description text          │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │ rgba(255,255,255,0.02) Input BG         │  │  │
│  │  │ #8A8A8A placeholder text                │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ┌──────────────────┐                         │  │
│  │  │ Gold Gradient    │  Primary Button         │  │
│  │  │ #F5B041 → #D4941C│  Text: #000000          │  │
│  │  └──────────────────┘                         │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Typography

### Font Stack

| Role | Font | Fallbacks | Weight |
|------|------|-----------|--------|
| **Display** | Space Grotesk | sans-serif | 600, 700 |
| **Body** | Inter | -apple-system, BlinkMacSystemFont, sans-serif | 400, 500, 600 |
| **Mono** | JetBrains Mono | monospace | 400, 500 |

```css
--font-display: 'Space Grotesk', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Hero** | 2rem (32px) | 700 | 1.2 | Landing page hero |
| **H1** | 1.5rem (24px) | 700 | 1.3 | Page titles |
| **H2** | 1.25rem (20px) | 600 | 1.3 | Section headers |
| **H3** | 1.125rem (18px) | 600 | 1.4 | Card titles |
| **Body** | 0.9375rem (15px) | 400 | 1.5 | Default body text |
| **Body Small** | 0.8125rem (13px) | 400 | 1.5 | Secondary text |
| **Caption** | 0.75rem (12px) | 500 | 1.4 | Labels, captions |
| **Micro** | 0.6875rem (11px) | 500 | 1.4 | Badges, tags |
| **Tiny** | 0.625rem (10px) | 500 | 1.3 | Timestamps |

### Typography Examples

```
Space Grotesk 700 — Hero Title
The Liquidity Layer for Yield-Bearing Assets

Space Grotesk 600 — Section Header
Your veIGNIS Locks

Inter 400 — Body Text
Lock your IGNIS tokens to receive veIGNIS voting power 
and earn protocol rewards.

JetBrains Mono 500 — Numbers/Code
$124,567.89  •  0x1234...5678
```

### Special Text Treatments

#### Gradient Text

```css
.text-gradient {
    background: linear-gradient(135deg, #EF4444, #F97316, #F5B041);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

#### Gold Text

```css
.gold-text {
    color: #F5B041;
}
```

#### Uppercase Labels

```css
.label {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #8A8A8A;
}
```

---

## Spacing & Layout

### Spacing Scale

| Name | Value | Usage |
|------|-------|-------|
| **xs** | 4px | Tight spacing, icon gaps |
| **sm** | 8px | Compact spacing |
| **md** | 12px | Default component padding |
| **lg** | 16px | Card padding, section gaps |
| **xl** | 24px | Large gaps |
| **2xl** | 32px | Section spacing |
| **3xl** | 48px | Major sections |
| **4xl** | 64px | Page sections |

### Border Radius Scale

| Name | Value | Usage |
|------|-------|-------|
| **xs** | 3px | Tiny elements |
| **sm** | 4px | Badges, tags |
| **md** | 6px | Inputs, small buttons |
| **lg** | 8px | Buttons |
| **xl** | 10px | Cards (default) |
| **2xl** | 12px | Large cards |
| **3xl** | 14px | Modal corners |
| **4xl** | 16px | Large containers |
| **5xl** | 20px | Hero elements |
| **6xl** | 24px | Landing sections |
| **full** | 50% | Circles, pills |

### Container Widths

| Type | Max Width | Usage |
|------|-----------|-------|
| **Content** | 1100px | Main app content |
| **Wide** | 1400px | Landing page sections |
| **Narrow** | 480px | Swap card, modals |

### Grid System

```css
/* Two Column Layout */
.two-column-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
}

/* Responsive Breakpoints */
@media (max-width: 768px) {
    .two-column-layout {
        grid-template-columns: 1fr;
    }
}
```

---

## Components

### Buttons

#### Primary Button

```css
.btn--primary {
    background: linear-gradient(135deg, #F5B041, #D4941C);
    color: #000000;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
}

.btn--primary:hover {
    box-shadow: 0 4px 12px rgba(245, 176, 65, 0.3);
    transform: translateY(-1px);
}
```

#### Secondary Button

```css
.btn--secondary {
    background: linear-gradient(135deg, rgba(245,176,65,0.15), rgba(245,176,65,0.05));
    color: #F5B041;
    border: 1px solid rgba(245,176,65,0.3);
}

.btn--secondary:hover {
    background: linear-gradient(135deg, rgba(245,176,65,0.25), rgba(245,176,65,0.1));
}
```

#### Ghost Button

```css
.btn--ghost {
    background: transparent;
    color: #A3A3A3;
    border: 1px solid rgba(255,255,255,0.06);
}

.btn--ghost:hover {
    background: rgba(255,255,255,0.03);
    color: #FFFFFF;
}
```

### Cards

```css
.card {
    background: linear-gradient(180deg, rgba(25,25,28,1) 0%, rgba(18,18,20,1) 100%);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 14px;
    padding: 1.5rem;
}

.card--clickable:hover {
    border-color: rgba(245, 176, 65, 0.3);
    transform: translateY(-2px);
}
```

### Inputs

```css
.input {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.875rem 1rem;
    color: #FFFFFF;
    font-family: 'JetBrains Mono', monospace;
}

.input:focus {
    border-color: #F5B041;
    outline: none;
    box-shadow: 0 0 0 4px rgba(245, 176, 65, 0.2);
}

.input::placeholder {
    color: #7A7A7A;
}
```

### Stat Boxes

```css
.stat-box {
    text-align: center;
    padding: 1rem;
}

.stat-box__value {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: #FFFFFF;
}

.stat-box__label {
    font-size: 0.75rem;
    color: #8A8A8A;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
}
```

### Tables

```css
.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    background: rgba(0, 0, 0, 0.3);
    color: #8A8A8A;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    text-align: left;
}

.data-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.data-table tr:hover {
    background: rgba(255, 255, 255, 0.02);
}
```

### Modals

```css
.modal-backdrop {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
}

.modal {
    background: linear-gradient(180deg, rgba(25,25,28,1), rgba(18,18,20,1));
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 480px;
    width: 90%;
}
```

---

## Iconography

### Icon Style

- **Stroke-based** icons (not filled)
- **2px stroke width**
- **Round line caps and joins**
- **24x24** default size

### Icon Colors

| Context | Color |
|---------|-------|
| Default | `#A3A3A3` |
| Active/Hover | `#FFFFFF` |
| Brand/Accent | `#F5B041` |
| Success | `#22C55E` |
| Error | `#EF4444` |
| Info | `#3B82F6` |
| Purple/ve | `#A78BFA` |

### Common Icons

```svg
<!-- Flame (Brand) -->
<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>

<!-- Swap Arrows -->
<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>

<!-- Chevron Down -->
<polyline points="6 9 12 15 18 9"/>

<!-- Settings -->
<circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>

<!-- Wallet -->
<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><circle cx="18" cy="12" r="2"/>
```

---

## Motion & Animation

### Transition Timing

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| **Fast** | 150ms | ease | Hovers, micro-interactions |
| **Normal** | 200ms | ease | State changes |
| **Slow** | 300ms | ease | Page transitions, modals |

```css
--transition-fast: 0.15s ease;
--transition-normal: 0.2s ease;
--transition-slow: 0.3s ease;
```

### Hover Interactions

```css
/* Lift effect */
.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Glow effect */
.btn--primary:hover {
    box-shadow: 0 4px 12px rgba(245, 176, 65, 0.3);
}

/* Border highlight */
.card:hover {
    border-color: rgba(245, 176, 65, 0.3);
}
```

### Loading States

```css
/* Skeleton pulse */
@keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
}

.skeleton {
    background: rgba(255, 255, 255, 0.05);
    animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Spinner */
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

### Page Transitions

```css
/* Fade in up */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fadeInUp 0.3s ease-out;
}
```

---

## Voice & Tone

### Brand Voice

| Attribute | Description |
|-----------|-------------|
| **Professional** | Precise, technical, credible |
| **Confident** | Bold statements, clear value props |
| **Accessible** | Complex concepts made clear |
| **Forward-looking** | Innovation-focused, future-oriented |

### Writing Guidelines

#### Headlines

- Use **title case** for major headlines
- Keep under **8 words**
- Lead with **benefits**, not features
- Use **action verbs**

✓ "The Liquidity Layer for Yield-Bearing Assets"
✗ "A Protocol That Provides Liquidity Services"

#### Body Copy

- Short paragraphs (2-3 sentences)
- Active voice
- Avoid jargon unless necessary
- Define technical terms on first use

#### CTAs

- Action-oriented ("Launch App", "Start Trading")
- Clear outcome ("Claim Rewards", "Connect Wallet")
- Urgency when appropriate ("Live on Mainnet")

### Terminology

| Use | Avoid |
|-----|-------|
| Yield-bearing assets | Yield tokens |
| Vault tokens | Receipt tokens |
| veIGNIS | veToken (generic) |
| Lock | Stake (when referring to veIGNIS) |
| Liquidity layer | DEX, AMM (too generic) |

---

## Usage Examples

### Hero Section

```html
<section class="hero">
    <div class="hero__badge">
        <span class="badge-dot"></span>
        Live on Mainnet
    </div>
    
    <h1 class="hero__title font-display">
        The Liquidity Layer for<br/>
        <span class="text-gradient">Yield-Bearing Assets</span>
    </h1>
    
    <p class="hero__subtitle">
        The infrastructure protocol that makes vault tokens 
        tradeable, liquid, and composable.
    </p>
    
    <div class="hero__actions">
        <button class="btn btn--primary btn--large">Launch App</button>
        <button class="btn btn--secondary btn--large">Learn More</button>
    </div>
</section>
```

### Stat Display

```html
<div class="stat-box">
    <div class="stat-box__value gold-text">$124M+</div>
    <div class="stat-box__label">Total Value Locked</div>
</div>
```

### Feature Card

```html
<div class="card card--clickable">
    <div class="card__icon" style="color: #22C55E;">
        <!-- Icon SVG -->
    </div>
    <h3 class="card__title">Instant Liquidity</h3>
    <p class="card__description">
        Trade vault tokens instantly with deep liquidity 
        and minimal slippage.
    </p>
</div>
```

### Data Row

```html
<tr class="data-table__row">
    <td>
        <div class="token-pair">
            <span class="token-icon">🔥</span>
            <span class="token-name">wstETH / ETH</span>
        </div>
    </td>
    <td class="text-right">
        <span class="value">$12.4M</span>
    </td>
    <td class="text-right">
        <span class="value" style="color: #22C55E;">12.4%</span>
    </td>
</tr>
```

---

## Quick Reference

### Colors (Copy-Paste)

```css
/* Brand */
--gold: #F5B041;
--gold-dark: #D4941C;

/* Semantic */
--success: #22C55E;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
--purple: #A855F7;

/* Backgrounds */
--bg-primary: #0A0A0B;
--bg-card: rgba(25, 25, 28, 1);

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #A3A3A3;
--text-muted: #8A8A8A;
--text-disabled: #7A7A7A;

/* Borders */
--border: rgba(255, 255, 255, 0.06);
--border-light: rgba(255, 255, 255, 0.04);
```

### Font Imports

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Gradient Classes

```css
.text-gradient {
    background: linear-gradient(135deg, #EF4444, #F97316, #F5B041);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.gold-gradient {
    background: linear-gradient(135deg, #F5B041, #D4941C);
}

.card-gradient {
    background: linear-gradient(180deg, rgba(25,25,28,1), rgba(18,18,20,1));
}
```

---

## File Downloads

- `icon-192.svg` — App icon (192x192)
- `icon-512.svg` — App icon (512x512)
- `manifest.json` — PWA manifest with brand colors

---

*IGNIS Protocol Brand Guide v1.0*
*Last updated: December 2024*
