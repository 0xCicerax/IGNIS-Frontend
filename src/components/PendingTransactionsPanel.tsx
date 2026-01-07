import { useState, memo } from 'react';
import { TX_STATUS, TX_TYPES, formatTimeAgo, getExplorerUrl } from '../hooks/usePendingTransactions';

const StatusIcon = memo(({ status }) => {
    if (status === TX_STATUS.PENDING) {
        return (
            <svg className="tx-spinner" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="rgba(245,176,65,0.3)" strokeWidth="3" fill="none"/>
                <circle cx="12" cy="12" r="10" stroke="#F5B041" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
            </svg>
        );
    }
    if (status === TX_STATUS.SUCCESS) {
        return (
            <div className="tx-status-icon tx-status-icon--success">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
        );
    }
    if (status === TX_STATUS.FAILED) {
        return (
            <div className="tx-status-icon tx-status-icon--error">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </div>
        );
    }
    return null;
});

const TransactionItem = memo(({ tx, onRemove }) => {
    const typeLabel = TX_TYPES[tx.type] || tx.type;
    
    return (
        <div className="tx-item">
            <StatusIcon status={tx.status} />
            <div className="tx-item__content">
                <div className="tx-item__header">
                    <span className="tx-item__type">{typeLabel}</span>
                    <span className="tx-item__time">{formatTimeAgo(tx.timestamp)}</span>
                </div>
                <div className="tx-item__summary">{tx.summary}</div>
                {tx.hash && (
                    <a href={getExplorerUrl(tx.hash)} target="_blank" rel="noopener noreferrer" className="tx-item__link">
                        View on BaseScan
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    </a>
                )}
                {tx.status === TX_STATUS.FAILED && tx.error && (
                    <div className="tx-item__error">{tx.error}</div>
                )}
            </div>
            {tx.status !== TX_STATUS.PENDING && (
                <button 
                    onClick={() => onRemove(tx.id)} 
                    className="tx-item__remove"
                    aria-label="Remove transaction"
                >×</button>
            )}
        </div>
    );
});

export const PendingTransactionsButton = ({ pendingCount, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`tx-pending-btn ${pendingCount > 0 ? 'tx-pending-btn--active' : 'tx-pending-btn--inactive'}`}
        >
            {pendingCount > 0 ? (
                <>
                    <svg className="tx-spinner" width="14" height="14" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="rgba(245,176,65,0.3)" strokeWidth="3" fill="none"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                    </svg>
                    {pendingCount} Pending
                </>
            ) : (
                <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Recent
                </>
            )}
        </button>
    );
};

export const PendingTransactionsPanel = ({ 
    isOpen, 
    onClose, 
    transactions, 
    onRemove, 
    onClear, 
    onClearCompleted,
    pendingCount,
}) => {
    const [filter, setFilter] = useState('all');
    
    if (!isOpen) return null;
    
    const filteredTxs = transactions.filter(tx => {
        if (filter === 'pending') return tx.status === TX_STATUS.PENDING;
        if (filter === 'completed') return tx.status !== TX_STATUS.PENDING;
        return true;
    });

    return (
        <>
            <div 
                onClick={onClose} 
                className="tx-panel-backdrop"
                role="button"
                tabIndex={-1}
                aria-label="Close transactions panel"
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
            />
            
            <div 
                className="tx-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tx-panel-title"
            >
                {/* Header */}
                <div className="tx-panel__header">
                    <div className="tx-panel__title">
                        <span id="tx-panel-title" className="tx-panel__title-text">Transactions</span>
                        {pendingCount > 0 && (
                            <span className="tx-panel__badge">{pendingCount} pending</span>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="tx-panel__close"
                        aria-label="Close transactions panel"
                    >×</button>
                </div>

                {/* Filters */}
                <div className="tx-panel__filters" role="group" aria-label="Filter transactions">
                    {['all', 'pending', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`tx-panel__filter-btn ${filter === f ? 'tx-panel__filter-btn--active' : ''}`}
                            aria-pressed={filter === f}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Transaction List */}
                <div className="tx-panel__list">
                    {filteredTxs.length === 0 ? (
                        <div className="tx-panel__empty">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="tx-panel__empty-icon">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <div style={{ fontSize: '0.875rem' }}>No {filter !== 'all' ? filter : ''} transactions</div>
                        </div>
                    ) : (
                        <div className="tx-panel__list-items">
                            {filteredTxs.map(tx => (
                                <TransactionItem key={tx.id} tx={tx} onRemove={onRemove} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {transactions.length > 0 && (
                    <div className="tx-panel__footer">
                        <button onClick={onClearCompleted} className="tx-panel__footer-btn tx-panel__footer-btn--secondary">
                            Clear Completed
                        </button>
                        <button onClick={onClear} className="tx-panel__footer-btn tx-panel__footer-btn--danger">
                            Clear All
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .tx-spinner {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </>
    );
};

export default PendingTransactionsPanel;
