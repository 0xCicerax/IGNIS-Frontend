import { toast, Id } from 'react-toastify';
import { formatAddress } from './format';

interface TxToast {
    pending: (message: string) => Id;
    success: (message: string, hash?: string, toastId?: Id, chainId?: number) => Id;
    error: (message: string, toastId?: Id) => Id;
    walletConnected: (address: string) => Id;
    walletDisconnected: () => Id;
    info: (message: string) => Id;
    dismiss: (toastId?: Id) => void;
}

const getExplorerUrl = (hash: string, chainId: number = 8453): string => {
    const explorers: Record<number, string> = {
        8453: 'https://basescan.org',
        84532: 'https://sepolia.basescan.org',
        56: 'https://bscscan.com',
        97: 'https://testnet.bscscan.com',
    };
    const explorer = explorers[chainId] || 'https://basescan.org';
    return `${explorer}/tx/${hash}`;
};

const getExplorerName = (chainId: number = 8453): string => {
    const names: Record<number, string> = {
        8453: 'BaseScan',
        84532: 'BaseScan',
        56: 'BscScan',
        97: 'BscScan',
    };
    return names[chainId] || 'Explorer';
};

const TxSuccessContent = ({ message, hash, chainId = 8453 }: { message: string; hash?: string; chainId?: number }): JSX.Element => (
    <div>
        <div style={{ marginBottom: hash ? '0.5rem' : 0 }}>{message}</div>
        {hash && (
            <a
                href={getExplorerUrl(hash, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: '#F5B041',
                    fontSize: '0.8125rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                }}
            >
                View on {getExplorerName(chainId)}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
            </a>
        )}
    </div>
);

export const showTxToast: TxToast = {
    pending: (message: string): Id => {
        return toast.loading(message, {
            position: 'bottom-right',
            theme: 'dark',
        });
    },

    success: (message: string, hash?: string, toastId?: Id, chainId?: number): Id => {
        const options = {
            type: 'success' as const,
            isLoading: false,
            autoClose: 5000,
            closeButton: true,
        };

        if (toastId) {
            toast.update(toastId, {
                render: <TxSuccessContent message={message} hash={hash} chainId={chainId} />,
                ...options,
            });
            return toastId;
        }

        return toast.success(<TxSuccessContent message={message} hash={hash} chainId={chainId} />, options);
    },

    error: (message: string, toastId?: Id): Id => {
        const options = {
            type: 'error' as const,
            isLoading: false,
            autoClose: 5000,
            closeButton: true,
        };

        if (toastId) {
            toast.update(toastId, {
                render: message,
                ...options,
            });
            return toastId;
        }

        return toast.error(message, options);
    },

    walletConnected: (address: string): Id => {
        return toast.success(`Wallet connected: ${formatAddress(address)}`, {
            position: 'bottom-right',
            autoClose: 3000,
            theme: 'dark',
        });
    },

    walletDisconnected: (): Id => {
        return toast.info('Wallet disconnected', {
            position: 'bottom-right',
            autoClose: 3000,
            theme: 'dark',
        });
    },

    info: (message: string): Id => {
        return toast.info(message, {
            position: 'bottom-right',
            autoClose: 4000,
            theme: 'dark',
        });
    },

    dismiss: (toastId?: Id): void => {
        if (toastId) {
            toast.dismiss(toastId);
        }
    },
};
