import { useEffect, lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Header, Footer } from './components/layout';
import { ErrorBoundary, PageErrorBoundary } from './components/ErrorBoundary';
import { PageTransition } from './components/ui';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { showTxToast } from './utils/toast';
import { usePendingTransactions, useSettings, useGlobalShortcuts } from './hooks';
import { useWallet } from './contexts';
import './styles/animations.css';
import './styles/pool-detail.css';
import './styles/MarketDepthPage.css';
import './styles/LandingPage.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SwapPage = lazy(() => import('./pages/SwapPage').then(m => ({ default: m.SwapPage })));
const PoolsPage = lazy(() => import('./pages/PoolsPage').then(m => ({ default: m.PoolsPage })));
const PoolDetailPage = lazy(() => import('./pages/PoolDetailPage').then(m => ({ default: m.PoolDetailPage })));
const LiquidityPage = lazy(() => import('./pages/LiquidityPage').then(m => ({ default: m.LiquidityPage })));
const StakePage = lazy(() => import('./pages/StakePage').then(m => ({ default: m.StakePage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const MarketDepthPage = lazy(() => import('./pages/MarketDepthPage').then(m => ({ default: m.MarketDepthPage })));

// Loading skeleton for lazy-loaded pages
const PageSkeleton = () => (
    <div className="page-skeleton" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
    }}>
        <div className="skeleton-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(245, 176, 65, 0.2)',
            borderTopColor: '#F5B041',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
        }} />
        <div style={{ color: '#8A8A8A', fontSize: '0.875rem' }}>Loading...</div>
    </div>
);

type TabName = 'swap' | 'pools' | 'depth' | 'liquidity' | 'portfolio' | 'stake' | 'analytics';

// App Layout wrapper for DEX pages (includes header/footer)
function AppLayout(): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();
    const { address, isConnected, connect } = useWallet();
    
    const pendingTxs = usePendingTransactions();
    const settings = useSettings();
    
    // Keyboard shortcuts modal
    const [shortcutsOpen, setShortcutsOpen] = useState(false);

    // Global keyboard shortcuts
    useGlobalShortcuts({
        onSearch: () => {
            // Focus search if available
            const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
            searchInput?.focus();
        },
        onHelp: () => {
            setShortcutsOpen(prev => !prev);
        },
        onNavigate: (path) => {
            navigate(path);
        },
    });

    const getActiveTab = (): TabName => {
        const path = location.pathname.replace('/app', '').slice(1) || 'swap';
        if (path.startsWith('pool/')) return 'pools';
        const validTabs: TabName[] = ['swap', 'pools', 'depth', 'liquidity', 'portfolio', 'stake', 'analytics'];
        return validTabs.includes(path as TabName) ? (path as TabName) : 'swap';
    };

    const setActiveTab = (tab: TabName): void => {
        navigate(`/app/${tab}`);
    };

    useEffect(() => {
        if (isConnected && address) {
            showTxToast.walletConnected(address);
        }
    }, [isConnected, address]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Skip link for keyboard navigation */}
            <a 
                href="#main-content" 
                className="skip-link"
                style={{
                    position: 'absolute',
                    top: '-40px',
                    left: 0,
                    background: '#F5B041',
                    color: '#0A0A0B',
                    padding: '8px 16px',
                    zIndex: 9999,
                    textDecoration: 'none',
                    fontWeight: 600,
                    borderRadius: '0 0 8px 0',
                    transition: 'top 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.top = '0'}
                onBlur={(e) => e.currentTarget.style.top = '-40px'}
            >
                Skip to main content
            </a>
            <Header 
                activeTab={getActiveTab()} 
                setActiveTab={setActiveTab}
                pendingTxs={pendingTxs}
            />
            <main id="main-content" style={{ flex: 1 }} tabIndex={-1}>
                <Suspense fallback={<PageSkeleton />}>
                    <PageTransition transitionKey={location.pathname} type="fade" duration={150}>
                        <Routes>
                            <Route index element={<Navigate to="/app/swap" replace />} />
                            <Route path="swap" element={
                                <PageErrorBoundary pageName="Swap">
                                    <SwapPage 
                                        isConnected={isConnected}
                                        onConnect={connect}
                                        pendingTxs={pendingTxs}
                                        settings={settings}
                                    />
                                </PageErrorBoundary>
                            } />
                            <Route path="pools" element={
                                <PageErrorBoundary pageName="Pools">
                                    <PoolsPage 
                                        isConnected={isConnected}
                                        onConnect={connect}
                                    />
                                </PageErrorBoundary>
                            } />
                            <Route path="pool/:poolId" element={
                                <PageErrorBoundary pageName="Pool Detail">
                                    <PoolDetailPage 
                                        isConnected={isConnected}
                                        onConnect={connect}
                                    />
                                </PageErrorBoundary>
                            } />
                            <Route path="depth" element={
                                <PageErrorBoundary pageName="Market Depth">
                                    <MarketDepthPage />
                                </PageErrorBoundary>
                            } />
                            <Route path="liquidity" element={
                                <PageErrorBoundary pageName="Liquidity">
                                    <LiquidityPage 
                                        pendingTxs={pendingTxs}
                                        onPositionClick={(poolId) => navigate(`/app/pool/${poolId}`)}
                                    />
                                </PageErrorBoundary>
                            } />
                            <Route path="portfolio" element={
                                <PageErrorBoundary pageName="Portfolio">
                                    <PortfolioPage />
                                </PageErrorBoundary>
                            } />
                            <Route path="stake" element={
                                <PageErrorBoundary pageName="Stake">
                                    <StakePage pendingTxs={pendingTxs} />
                                </PageErrorBoundary>
                            } />
                            <Route path="analytics" element={
                                <PageErrorBoundary pageName="Analytics">
                                    <AnalyticsPage />
                                </PageErrorBoundary>
                            } />
                            <Route path="*" element={<Navigate to="/app/swap" replace />} />
                        </Routes>
                    </PageTransition>
                </Suspense>
            </main>
            <Footer />
            
            {/* Keyboard Shortcuts Help Modal */}
            <KeyboardShortcutsModal 
                isOpen={shortcutsOpen} 
                onClose={() => setShortcutsOpen(false)} 
            />
        </div>
    );
}

// Main App Component
function App(): JSX.Element {
    return (
        <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
                <Routes>
                    {/* Landing page at root */}
                    <Route path="/" element={<LandingPage />} />
                    
                    {/* DEX app under /app/* */}
                    <Route path="/app/*" element={<AppLayout />} />
                    
                    {/* Catch-all redirect to landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
