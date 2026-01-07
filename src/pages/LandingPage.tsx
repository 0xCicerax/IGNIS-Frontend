import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/LandingPage.css';

// Types
interface IconProps {
    size?: number;
    color?: string;
}

interface Feature {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    description: string;
}

interface Benefit {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    description: string;
}

interface Partner {
    name: string;
    type: string;
    color: string;
}

// Icons as components
const FlameIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
);

const FlameIconFilled: React.FC<{ size?: number }> = ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
            <linearGradient id="flame-grad-landing" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ea580c"/>
                <stop offset="50%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#fbbf24"/>
            </linearGradient>
        </defs>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#flame-grad-landing)"/>
    </svg>
);

const BoltIcon: React.FC<IconProps> = ({ size = 24, color = "#22C55E" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
);

const ChartIcon: React.FC<IconProps> = ({ size = 24, color = "#A78BFA" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const ShieldIcon: React.FC<IconProps> = ({ size = 24, color = "#F5B041" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const RefreshIcon: React.FC<IconProps> = ({ size = 24, color = "#22C55E" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
);

const LinkIcon: React.FC<IconProps> = ({ size = 24, color = "#A78BFA" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

const MenuIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);

const TwitterIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const DiscordIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
);

const GithubIcon: React.FC = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

const CheckIcon: React.FC = () => (
    <span style={{ fontSize: '0.875rem' }}>✓</span>
);

// Benefit icons
const LiquidityIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
);

const TrendingIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
);

const CardIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
);

const GasIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5B041" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
);

const UsersIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const CodeIcon: React.FC = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
);

// Feature data
const features: Feature[] = [
    {
        icon: <FlameIcon size={24} color="#F5B041" />,
        iconClass: 'landing-feature-card__icon--gold',
        title: 'Yield-Native Pools',
        description: 'Pools that understand vault tokens. Your liquidity continues earning yield while sitting in the pool, with no opportunity cost.'
    },
    {
        icon: <BoltIcon />,
        iconClass: 'landing-feature-card__icon--green',
        title: 'Gateway Buffers',
        description: 'Trade underlying assets directly against vault tokens. Our buffer system absorbs conversions, saving you 60% on gas.'
    },
    {
        icon: <ChartIcon />,
        iconClass: 'landing-feature-card__icon--purple',
        title: 'Deep Liquidity',
        description: 'Concentrated liquidity with yield-aware pricing. Swap large positions with minimal price impact across all major vaults.'
    },
    {
        icon: <ShieldIcon />,
        iconClass: 'landing-feature-card__icon--gold',
        title: 'MEV Protection',
        description: 'Built-in MEV capture mechanisms that return extracted value to liquidity providers instead of external searchers.'
    },
    {
        icon: <RefreshIcon />,
        iconClass: 'landing-feature-card__icon--green',
        title: 'IGNI Rewards',
        description: 'Protocol fees and captured MEV are distributed to liquidity providers as IGNI tokens, aligning long-term incentives.'
    },
    {
        icon: <LinkIcon />,
        iconClass: 'landing-feature-card__icon--purple',
        title: 'ERC-4626 Native',
        description: 'First-class support for the ERC-4626 vault standard. Seamless integration with Yearn, Morpho, Aave, and more.'
    }
];

// Benefits data
const benefits: Benefit[] = [
    { icon: <LiquidityIcon />, iconClass: 'landing-benefit-card__icon--blue', title: 'Instant Liquidity', description: 'Your vault tokens become tradeable immediately. No need to bootstrap liquidity pools or incentivize LPs yourself.' },
    { icon: <TrendingIcon />, iconClass: 'landing-benefit-card__icon--green', title: 'Price Discovery', description: 'Manipulation-resistant oracles provide reliable price feeds for your vault tokens across DeFi.' },
    { icon: <CardIcon />, iconClass: 'landing-benefit-card__icon--purple', title: 'DeFi Composability', description: 'Once listed, your vault tokens can be used as collateral, in lending markets, and across the DeFi ecosystem.' },
    { icon: <GasIcon />, iconClass: 'landing-benefit-card__icon--gold', title: 'Gas Abstraction', description: 'Users trade underlying assets directly — our gateway buffers handle vault deposits/withdrawals, saving 60% on gas.' },
    { icon: <UsersIcon />, iconClass: 'landing-benefit-card__icon--green', title: 'User Acquisition', description: 'Tap into our network. Every protocol integrating IGNIS brings users to your vault.' },
    { icon: <CodeIcon />, iconClass: 'landing-benefit-card__icon--purple', title: 'Zero Integration Work', description: 'ERC-4626 compliant? You\'re already compatible. Permissionless listing means no gatekeepers.' }
];

// Partners data
const partners: Partner[] = [
    { name: 'Meridian Finance', type: 'Vault Provider', color: '#0082FF' },
    { name: 'Helix Vaults', type: 'Vault Provider', color: '#0066FF' },
    { name: 'Axiom Yield', type: 'Vault Provider', color: '#B6509E' },
    { name: 'Citadel Risk', type: 'Risk Curator', color: '#627EEA' },
    { name: 'Stratos Lend', type: 'Vault Provider', color: '#00D395' },
    { name: 'Redstone Analytics', type: 'Risk Curator', color: '#FF6B35' },
    { name: 'Vantage Labs', type: 'Risk Curator', color: '#8B5CF6' },
    { name: 'Forge Protocol', type: 'Vault Provider', color: '#F5B041' }
];

// Custom hook for scroll animations
const useScrollAnimation = (): void => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        
        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => observer.observe(el));
        
        return () => observer.disconnect();
    }, []);
};

// Header Component
const LandingHeader: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    return (
        <header className={`landing-header ${scrolled ? 'landing-header--scrolled' : ''}`}>
            <div className="landing-header__container">
                <Link to="/" className="landing-header__logo">
                    <div className="landing-header__logo-icon">
                        <FlameIconFilled size={28} />
                    </div>
                    <div className="landing-header__logo-text text-gradient">IGNIS</div>
                </Link>
                
                <nav className={`landing-header__nav ${mobileMenuOpen ? 'landing-header__nav--open' : ''}`}>
                    <a href="#features" className="landing-header__nav-link">Features</a>
                    <a href="#for-vaults" className="landing-header__nav-link">For Vaults</a>
                    <a href="#protocol" className="landing-header__nav-link">Protocol</a>
                    <a href="https://docs.ignis.finance" className="landing-header__nav-link" target="_blank" rel="noopener noreferrer">Docs</a>
                </nav>
                
                <div className="landing-header__cta">
                    <button className="landing-btn landing-btn--primary" onClick={() => navigate('/app/swap')}>Launch App →</button>
                </div>
                
                <button className="landing-mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

// Hero Section
const Hero: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <section className="landing-hero">
            <div className="landing-hero__badge">
                <span className="landing-hero__badge-dot"></span>
                <span>ERC-4626 Yield Infrastructure</span>
            </div>
            
            <h1 className="landing-hero__title font-display">
                The Liquidity Layer for<br />
                <span className="text-gradient">Yield-Bearing Assets</span>
            </h1>
            
            <p className="landing-hero__subtitle">
                The infrastructure protocol that makes vault tokens tradeable, liquid, and composable. 
                Powering the next generation of yield-bearing asset markets.
            </p>
            
            <div className="landing-hero__actions">
                <button className="landing-btn landing-btn--primary landing-btn--large" onClick={() => navigate('/app/swap')}>Launch App</button>
                <a href="#for-vaults" className="landing-btn landing-btn--secondary landing-btn--large">For Vault Providers</a>
            </div>
            
            <div className="landing-hero__stats">
                <div className="landing-hero__stat">
                    <div className="landing-hero__stat-value gold-text">$124M+</div>
                    <div className="landing-hero__stat-label">Total Value Locked</div>
                </div>
                <div className="landing-hero__stat">
                    <div className="landing-hero__stat-value" style={{ color: '#22C55E' }}>$2.4B+</div>
                    <div className="landing-hero__stat-label">Total Volume</div>
                </div>
                <div className="landing-hero__stat">
                    <div className="landing-hero__stat-value" style={{ color: '#A78BFA' }}>847K+</div>
                    <div className="landing-hero__stat-label">Transactions</div>
                </div>
                <div className="landing-hero__stat">
                    <div className="landing-hero__stat-value gold-text">12,400+</div>
                    <div className="landing-hero__stat-label">Active Users</div>
                </div>
                <div className="landing-hero__stat">
                    <div className="landing-hero__stat-value" style={{ color: '#22C55E' }}>42+</div>
                    <div className="landing-hero__stat-label">Supported Vaults</div>
                </div>
            </div>
        </section>
    );
};

// Features Section
const Features: React.FC = () => (
    <section className="landing-features" id="features">
        <div className="landing-section__header animate-on-scroll">
            <span className="landing-section__label">Infrastructure</span>
            <h2 className="landing-section__title font-display">Everything Vaults Need to Scale</h2>
            <p className="landing-section__subtitle">Complete infrastructure for vault tokens: trading, liquidity, price discovery, and DeFi composability — all in one protocol.</p>
        </div>
        
        <div className="landing-features__grid">
            {features.map((feature, index) => (
                <div className="landing-feature-card animate-on-scroll" key={index}>
                    <div className={`landing-feature-card__icon ${feature.iconClass}`}>
                        {feature.icon}
                    </div>
                    <h3 className="landing-feature-card__title">{feature.title}</h3>
                    <p className="landing-feature-card__desc">{feature.description}</p>
                </div>
            ))}
        </div>
    </section>
);

// For Vault Providers Section
const ForVaults: React.FC = () => (
    <section className="landing-for-vaults" id="for-vaults">
        <div className="landing-for-vaults__container">
            <div className="landing-section__header animate-on-scroll">
                <span className="landing-section__label">For Vault Providers</span>
                <h2 className="landing-section__title font-display">Your Vault's Growth Engine</h2>
                <p className="landing-section__subtitle">Stop worrying about liquidity and integrations. Plug into IGNIS and get instant access to deep markets.</p>
            </div>
            
            <div className="landing-benefits-grid">
                {benefits.map((benefit, index) => (
                    <div className="landing-benefit-card animate-on-scroll" key={index}>
                        <div className={`landing-benefit-card__icon ${benefit.iconClass}`}>
                            {benefit.icon}
                        </div>
                        <h3 className="landing-benefit-card__title">{benefit.title}</h3>
                        <p className="landing-benefit-card__desc">{benefit.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// Partners Section
const Partners: React.FC = () => (
    <section className="landing-partners" id="partners">
        <div className="landing-partners__container">
            <div className="landing-section__header animate-on-scroll">
                <span className="landing-section__label">Ecosystem</span>
                <h2 className="landing-section__title font-display">Integrated Partners</h2>
                <p className="landing-section__subtitle">Leading vault providers and risk curators building on IGNIS infrastructure.</p>
            </div>
            
            <div className="landing-partners__grid animate-on-scroll">
                {partners.map((partner, index) => (
                    <div className="landing-partner-card" key={index}>
                        <div className="landing-partner-card__logo">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="12" stroke={partner.color} strokeWidth="2"/>
                                <circle cx="16" cy="16" r="4" stroke={partner.color} strokeWidth="2"/>
                            </svg>
                        </div>
                        <div className="landing-partner-card__name">{partner.name}</div>
                        <div className="landing-partner-card__type">{partner.type}</div>
                    </div>
                ))}
            </div>
            
            <div className="landing-partners__cta animate-on-scroll">
                <p className="landing-partners__cta-text">Ready to plug your vault into IGNIS infrastructure?</p>
                <a href="#" className="landing-btn landing-btn--secondary">Integrate Your Vault</a>
            </div>
        </div>
    </section>
);

// Protocol Section
const Protocol: React.FC = () => (
    <section className="landing-protocol" id="protocol">
        <div className="landing-protocol__container">
            <div className="landing-protocol__grid">
                <div className="landing-protocol__content animate-on-scroll">
                    <span className="landing-section__label">Why ERC-4626</span>
                    <h2 className="landing-section__title font-display">The Standard That<br />Changes Everything</h2>
                    <p className="landing-section__subtitle" style={{ margin: 0 }}>
                        ERC-4626 is the tokenized vault standard. IGNIS is the infrastructure that makes these vaults liquid, tradeable, and composable across DeFi.
                    </p>
                    
                    <ul className="landing-protocol__list">
                        <li className="landing-protocol__list-item">
                            <span className="landing-protocol__list-icon"><CheckIcon /></span>
                            <span className="landing-protocol__list-text">Universal compatibility — any ERC-4626 vault works out of the box</span>
                        </li>
                        <li className="landing-protocol__list-item">
                            <span className="landing-protocol__list-icon"><CheckIcon /></span>
                            <span className="landing-protocol__list-text">Reliable price oracles that lending markets and protocols can trust</span>
                        </li>
                        <li className="landing-protocol__list-item">
                            <span className="landing-protocol__list-icon"><CheckIcon /></span>
                            <span className="landing-protocol__list-text">Deep liquidity pools enabling large trades with minimal slippage</span>
                        </li>
                        <li className="landing-protocol__list-item">
                            <span className="landing-protocol__list-icon"><CheckIcon /></span>
                            <span className="landing-protocol__list-text">Gateway buffers that abstract vault complexity from end users</span>
                        </li>
                    </ul>
                </div>
                
                <div className="landing-protocol__visual animate-on-scroll floating">
                    <div className="landing-protocol__diagram">
                        <div className="landing-diagram-row">
                            <div className="landing-diagram-box">
                                <div className="landing-diagram-box__label">Input</div>
                                <div className="landing-diagram-box__value">USDC</div>
                            </div>
                            <span className="landing-diagram-arrow">→</span>
                            <div className="landing-diagram-box landing-diagram-box--gold">
                                <div className="landing-diagram-box__label">Gateway</div>
                                <div className="landing-diagram-box__value">Buffer</div>
                            </div>
                            <span className="landing-diagram-arrow">→</span>
                            <div className="landing-diagram-box">
                                <div className="landing-diagram-box__label">Output</div>
                                <div className="landing-diagram-box__value">yvUSDC</div>
                            </div>
                        </div>
                        
                        <div className="landing-diagram-flow">
                            <div className="landing-diagram-flow__dot"></div>
                            <div className="landing-diagram-flow__dot"></div>
                            <div className="landing-diagram-flow__dot"></div>
                            <div className="landing-diagram-flow__dot"></div>
                        </div>
                        
                        <div className="landing-diagram-row">
                            <div className="landing-diagram-box">
                                <div className="landing-diagram-box__label">Gas Saved</div>
                                <div className="landing-diagram-box__value" style={{ color: '#22C55E' }}>60%</div>
                            </div>
                            <div className="landing-diagram-box landing-diagram-box--gold">
                                <div className="landing-diagram-box__label">Yield</div>
                                <div className="landing-diagram-box__value" style={{ color: '#F5B041' }}>+8.4%</div>
                            </div>
                            <div className="landing-diagram-box">
                                <div className="landing-diagram-box__label">Slippage</div>
                                <div className="landing-diagram-box__value" style={{ color: '#A78BFA' }}>{'<0.001%'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// CTA Section
const CTA: React.FC = () => {
    const navigate = useNavigate();
    
    return (
        <section className="landing-cta">
            <div className="landing-cta__container">
                <div className="landing-cta__box animate-on-scroll">
                    <h2 className="landing-cta__title font-display">The Future of <span className="text-gradient">Yield Infrastructure</span></h2>
                    <p className="landing-cta__subtitle">Whether you're a trader, protocol, LP, or vault provider — IGNIS is the infrastructure layer you've been waiting for.</p>
                    <div className="landing-cta__actions">
                        <button className="landing-btn landing-btn--primary landing-btn--large" onClick={() => navigate('/app/swap')}>Launch App</button>
                        <a href="https://docs.ignis.finance" className="landing-btn landing-btn--secondary landing-btn--large" target="_blank" rel="noopener noreferrer">Read Docs</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Footer Component
const LandingFooter: React.FC = () => (
    <footer className="landing-footer">
        <div className="landing-footer__container">
            <div className="landing-footer__logo">
                <FlameIconFilled size={36} />
                <span className="landing-footer__logo-text gold-text">IGNIS</span>
            </div>
            
            <nav className="landing-footer__links">
                <a href="https://docs.ignis.finance" className="landing-footer__link" target="_blank" rel="noopener noreferrer">Documentation</a>
                <a href="#" className="landing-footer__link">Governance</a>
                <a href="#" className="landing-footer__link">Bug Bounty</a>
                <a href="#" className="landing-footer__link">Brand Kit</a>
                <a href="#" className="landing-footer__link">Careers</a>
            </nav>
            
            <div className="landing-footer__social">
                <a href="#" className="landing-footer__social-link" aria-label="Twitter"><TwitterIcon /></a>
                <a href="#" className="landing-footer__social-link" aria-label="Discord"><DiscordIcon /></a>
                <a href="#" className="landing-footer__social-link" aria-label="GitHub"><GithubIcon /></a>
            </div>
        </div>
    </footer>
);

// Main Landing Page Component
const LandingPage: React.FC = () => {
    useScrollAnimation();
    
    return (
        <div className="landing-page">
            <div className="landing-bg-glow"></div>
            <div className="landing-bg-grid"></div>
            
            <LandingHeader />
            <Hero />
            <Features />
            <ForVaults />
            <Partners />
            <Protocol />
            <CTA />
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
