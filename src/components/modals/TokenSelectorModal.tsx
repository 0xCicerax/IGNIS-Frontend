import { useState, useMemo } from 'react';
import { TOKENS } from '../../data';
import { TokenIcon } from '../ui';
import type { Token, TokenSelectorModalProps } from '../../types';

export const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    selectedToken, 
    otherToken,
    favoriteTokens = ['ETH', 'USDC', 'IGNIS'],
    recentTokens = [],
    onToggleFavorite,
}) => {
    const [search, setSearch] = useState('');
    
    const filteredTokens = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query) return TOKENS.filter(t => t.symbol !== otherToken?.symbol);
        
        return TOKENS.filter(t => {
            if (t.symbol === otherToken?.symbol) return false;
            return (
                t.symbol.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query) ||
                (t.address && t.address.toLowerCase().includes(query))
            );
        });
    }, [search, otherToken]);
    
    const { favorites, recent, other } = useMemo(() => {
        const favs: Token[] = [];
        const rec: Token[] = [];
        const rest: Token[] = [];
        
        filteredTokens.forEach(token => {
            if (favoriteTokens.includes(token.symbol)) {
                favs.push(token);
            } else if (recentTokens.includes(token.symbol)) {
                rec.push(token);
            } else {
                rest.push(token);
            }
        });
        
        favs.sort((a, b) => favoriteTokens.indexOf(a.symbol) - favoriteTokens.indexOf(b.symbol));
        rec.sort((a, b) => recentTokens.indexOf(a.symbol) - recentTokens.indexOf(b.symbol));
        
        return { favorites: favs, recent: rec, other: rest };
    }, [filteredTokens, favoriteTokens, recentTokens]);
    
    const handleSelect = (token: Token): void => {
        onSelect(token);
        onClose();
    };
    
    if (!isOpen) return null;
    
    const TokenRow: React.FC<{ token: Token; showFavorite?: boolean }> = ({ token, showFavorite = true }) => {
        const isSelected = selectedToken?.symbol === token.symbol;
        return (
            <button 
                onClick={() => handleSelect(token)} 
                className={`token-list__row ${isSelected ? 'token-list__row--selected' : ''}`}
            >
                <TokenIcon token={token} size={40} showProtocol />
                <div className="token-list__info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="token-list__symbol">{token.symbol}</span>
                        {token.isYieldBearing && (
                            <span className="token-list__yield-badge">YIELD</span>
                        )}
                    </div>
                    <div className="token-list__name">{token.name}</div>
                </div>
                <div className="token-list__balance">
                    <div className="token-list__balance-amount">
                        {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                    <div className="token-list__balance-usd">
                        ${(token.balance * token.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                </div>
                {showFavorite && onToggleFavorite && (
                    <button
                        onClick={e => { e.stopPropagation(); onToggleFavorite(token.symbol); }}
                        className={`token-list__favorite-btn ${favoriteTokens.includes(token.symbol) ? 'token-list__favorite-btn--active' : ''}`}
                        aria-label={favoriteTokens.includes(token.symbol) ? `Remove ${token.symbol} from favorites` : `Add ${token.symbol} to favorites`}
                        aria-pressed={favoriteTokens.includes(token.symbol)}
                    >
                        {favoriteTokens.includes(token.symbol) ? '★' : '☆'}
                    </button>
                )}
            </button>
        );
    };
    
    const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
        <div className="token-list__section-header">{title}</div>
    );
    
    return (
        <div 
            onClick={onClose} 
            className="modal-overlay"
            role="presentation"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="token-selector-title"
            >
                <div className="modal__header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 id="token-selector-title" className="modal__title">Select Token</h3>
                        <button 
                            onClick={onClose} 
                            className="modal__close-btn modal__close-btn--text"
                            aria-label="Close token selector"
                        >×</button>
                    </div>
                    
                    <div className="modal__search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="2" className="modal__search-icon" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Search name, symbol, or address" 
                            autoFocus 
                            className="modal__search-input"
                            aria-label="Search tokens"
                        />
                        {search && (
                            <button 
                                onClick={() => setSearch('')} 
                                className="modal__search-clear"
                                aria-label="Clear search"
                            >×</button>
                        )}
                    </div>
                </div>
                
                <div className="token-list">
                    {filteredTokens.length === 0 ? (
                        <div className="token-list__empty">
                            <div className="token-list__empty-icon">🔍</div>
                            <div>No tokens found for "{search}"</div>
                            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                Try searching by name, symbol, or paste an address
                            </div>
                        </div>
                    ) : (
                        <>
                            {favorites.length > 0 && !search && (
                                <>
                                    <SectionHeader title="⭐ Favorites" />
                                    {favorites.map(token => <TokenRow key={token.symbol} token={token} />)}
                                </>
                            )}
                            
                            {recent.length > 0 && !search && (
                                <>
                                    <SectionHeader title="🕐 Recent" />
                                    {recent.map(token => <TokenRow key={token.symbol} token={token} />)}
                                </>
                            )}
                            
                            {other.length > 0 && (
                                <>
                                    {!search && (favorites.length > 0 || recent.length > 0) && (
                                        <SectionHeader title="All Tokens" />
                                    )}
                                    {other.map(token => <TokenRow key={token.symbol} token={token} />)}
                                </>
                            )}
                            
                            {search && (
                                [...favorites, ...recent, ...other].map(token => (
                                    <TokenRow key={token.symbol} token={token} />
                                ))
                            )}
                        </>
                    )}
                </div>
                
                <div className="modal__footer">Click ☆ to add tokens to favorites</div>
            </div>
        </div>
    );
};
