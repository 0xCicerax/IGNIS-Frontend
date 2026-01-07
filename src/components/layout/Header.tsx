import { useState } from 'react';
import { IgnisLogo } from '../ui';
import { PendingTransactionsButton, PendingTransactionsPanel } from '../PendingTransactionsPanel';
import { useWallet } from '../../contexts';

export const Header = ({ activeTab, setActiveTab, pendingTxs }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [txPanelOpen, setTxPanelOpen] = useState(false);
    const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
    
    const navItems = [
        { id: 'swap', label: 'Swap' }, 
        { id: 'pools', label: 'Pools' }, 
        { id: 'depth', label: 'Depth' },
        { id: 'portfolio', label: 'Portfolio' },
        { id: 'liquidity', label: 'Liquidity' }, 
        { id: 'stake', label: 'Stake' },
        { id: 'analytics', label: 'Analytics' }
    ];

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <header className="header">
            <div className="header__container">
                {/* Logo */}
                <div className="header__logo">
                    <div className="header__logo-icon">
                        <IgnisLogo size={32} />
                    </div>
                    <div>
                        <span className="header__logo-text text-gradient">IGNIS</span>
                        <div className="header__logo-sub gold-text">AN AURELIA PRODUCT</div>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="header__nav desktop-nav" aria-label="Main navigation">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => setActiveTab(item.id)} 
                            className={`header__nav-btn ${activeTab === item.id ? 'header__nav-btn--active' : ''}`}
                            aria-current={activeTab === item.id ? 'page' : undefined}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Right Side - Transactions & Wallet */}
                <div className="header__actions">
                    {/* Pending Transactions Button */}
                    {pendingTxs && (
                        <PendingTransactionsButton 
                            pendingCount={pendingTxs.pendingCount} 
                            onClick={() => setTxPanelOpen(true)} 
                        />
                    )}
                    
                    {/* Demo Wallet Button */}
                    {isConnected && address ? (
                        <>
                            {/* Chain Indicator */}
                            <button
                                className="header__chain-btn header__chain-btn--connected hide-mobile"
                                aria-label="Current network: Base"
                            >
                                <div className="header__chain-dot" style={{ background: '#0052FF' }} aria-hidden="true" />
                                Base
                            </button>

                            {/* Account Button */}
                            <button
                                onClick={disconnect}
                                className="header__account-btn"
                                aria-label={`Connected: ${formatAddress(address)}. Click to disconnect.`}
                            >
                                <span className="header__account-balance hide-mobile">
                                    Demo Mode
                                </span>
                                <span className="header__account-address">
                                    {formatAddress(address)}
                                </span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="header__connect-btn"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}

                    {/* Mobile Menu Button */}
                    <button 
                        className="header__mobile-btn mobile-menu-btn" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            {mobileMenuOpen ? (
                                <path d="M18 6L6 18M6 6l12 12" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <nav id="mobile-nav" className="header__mobile-menu" aria-label="Mobile navigation">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
                            className={`header__mobile-menu-btn ${activeTab === item.id ? 'header__mobile-menu-btn--active' : ''}`}
                            aria-current={activeTab === item.id ? 'page' : undefined}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            )}
            
            {/* Pending Transactions Panel */}
            {pendingTxs && (
                <PendingTransactionsPanel
                    isOpen={txPanelOpen}
                    onClose={() => setTxPanelOpen(false)}
                    transactions={pendingTxs.transactions}
                    pendingCount={pendingTxs.pendingCount}
                    onRemove={pendingTxs.removeTransaction}
                    onClear={pendingTxs.clearTransactions}
                    onClearCompleted={pendingTxs.clearCompleted}
                />
            )}
        </header>
    );
};
