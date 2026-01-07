import { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

type EmptyStateVariant = 
    | 'wallet-disconnected'
    | 'no-positions'
    | 'no-pools'
    | 'no-transactions'
    | 'no-rewards'
    | 'no-results'
    | 'loading-error';

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const EmptyIcons = {
    wallet: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M8 24h48" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <circle cx="44" cy="34" r="4" fill="currentColor" opacity="0.5"/>
            <path d="M20 40h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        </svg>
    ),
    positions: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
            <path d="M32 20v24M20 32h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        </svg>
    ),
    pools: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <circle cx="24" cy="32" r="12" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <circle cx="40" cy="32" r="12" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M32 24v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        </svg>
    ),
    transactions: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <rect x="12" y="16" width="40" height="8" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
            <rect x="12" y="28" width="40" height="8" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <rect x="12" y="40" width="40" height="8" rx="2" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
        </svg>
    ),
    rewards: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <path d="M32 12l4 12h12l-10 7 4 13-10-8-10 8 4-13-10-7h12l4-12z" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
        </svg>
    ),
    search: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <circle cx="28" cy="28" r="14" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M38 38l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        </svg>
    ),
    error: (
        <svg viewBox="0 0 64 64" fill="none" className="empty-state__svg">
            <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M32 20v16M32 42v2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
        </svg>
    ),
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    size = 'medium',
    className = '',
}) => (
    <div className={`empty-state empty-state--${size} ${className}`}>
        {icon && <div className="empty-state__icon">{icon}</div>}
        <h3 className="empty-state__title">{title}</h3>
        {description && <p className="empty-state__description">{description}</p>}
        {action && <div className="empty-state__action">{action}</div>}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PRESET EMPTY STATES
// ─────────────────────────────────────────────────────────────────────────────

interface ConnectWalletEmptyProps {
    onConnect: () => void;
    message?: string;
}

export const ConnectWalletEmpty: React.FC<ConnectWalletEmptyProps> = ({ 
    onConnect, 
    message = 'Connect your wallet to get started' 
}) => (
    <EmptyState
        icon={EmptyIcons.wallet}
        title="Wallet Not Connected"
        description={message}
        size="large"
        action={
            <button className="btn btn--primary btn--lg" onClick={onConnect}>
                Connect Wallet
            </button>
        }
    />
);

interface NoPositionsEmptyProps {
    onAddLiquidity?: () => void;
}

export const NoPositionsEmpty: React.FC<NoPositionsEmptyProps> = ({ onAddLiquidity }) => (
    <EmptyState
        icon={EmptyIcons.positions}
        title="No Liquidity Positions"
        description="You don't have any active liquidity positions yet. Add liquidity to start earning fees and rewards."
        action={
            onAddLiquidity && (
                <button className="btn btn--primary" onClick={onAddLiquidity}>
                    + Add Liquidity
                </button>
            )
        }
    />
);

export const NoPoolsEmpty: React.FC = () => (
    <EmptyState
        icon={EmptyIcons.pools}
        title="No Pools Found"
        description="No pools match your current filters. Try adjusting your search criteria."
    />
);

export const NoTransactionsEmpty: React.FC = () => (
    <EmptyState
        icon={EmptyIcons.transactions}
        title="No Transaction History"
        description="Your transaction history will appear here once you start trading."
        size="small"
    />
);

export const NoRewardsEmpty: React.FC = () => (
    <EmptyState
        icon={EmptyIcons.rewards}
        title="No Rewards to Claim"
        description="Earn rewards by providing liquidity or staking IGNIS."
        size="small"
    />
);

interface NoSearchResultsProps {
    query?: string;
    onClear?: () => void;
}

export const NoSearchResultsEmpty: React.FC<NoSearchResultsProps> = ({ query, onClear }) => (
    <EmptyState
        icon={EmptyIcons.search}
        title="No Results Found"
        description={query ? `No results for "${query}". Try a different search term.` : 'No matching results found.'}
        action={
            onClear && (
                <button className="btn btn--secondary btn--sm" onClick={onClear}>
                    Clear Search
                </button>
            )
        }
    />
);

interface LoadingErrorEmptyProps {
    onRetry?: () => void;
    message?: string;
}

export const LoadingErrorEmpty: React.FC<LoadingErrorEmptyProps> = ({ 
    onRetry, 
    message = 'Something went wrong while loading data.' 
}) => (
    <EmptyState
        icon={EmptyIcons.error}
        title="Failed to Load"
        description={message}
        action={
            onRetry && (
                <button className="btn btn--secondary" onClick={onRetry}>
                    Try Again
                </button>
            )
        }
    />
);

// ─────────────────────────────────────────────────────────────────────────────
// NO STAKES EMPTY
// ─────────────────────────────────────────────────────────────────────────────
interface NoStakesEmptyProps {
    onStake?: () => void;
}

export const NoStakesEmpty: React.FC<NoStakesEmptyProps> = ({ onStake }) => (
    <EmptyState
        icon={EmptyIcons.rewards}
        title="No IGNIS Staked"
        description="Lock your IGNIS tokens to receive veIGNIS, earn protocol fees, and boost your LP rewards."
        action={
            onStake && (
                <button className="btn btn--primary" onClick={onStake}>
                    Lock IGNIS
                </button>
            )
        }
    />
);

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO EMPTY SECTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const NoAssetsEmpty: React.FC = () => (
    <EmptyState
        icon={EmptyIcons.wallet}
        title="No Assets"
        description="Your token balances will appear here."
        size="small"
    />
);

export const NoActivityEmpty: React.FC = () => (
    <EmptyState
        icon={EmptyIcons.transactions}
        title="No Recent Activity"
        description="Your recent transactions will show up here."
        size="small"
    />
);
