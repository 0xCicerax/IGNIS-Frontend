import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Address } from '../types';

interface WalletContextType {
    address: Address | null;
    isConnected: boolean;
    isConnecting: boolean;
    chainId: number | null;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps): JSX.Element {
    const [address, setAddress] = useState<Address | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [chainId, setChainId] = useState<number | null>(null);

    const isConnected = !!address;

    const connect = useCallback(async (): Promise<void> => {
        setIsConnecting(true);
        
        // Simulate wallet connection for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate a demo address
        const demoAddress = `0x${Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('')}` as Address;
        
        setAddress(demoAddress);
        setChainId(8453); // Base chain
        setIsConnecting(false);
    }, []);

    const disconnect = useCallback((): void => {
        setAddress(null);
        setChainId(null);
    }, []);

    const value: WalletContextType = {
        address,
        isConnected,
        isConnecting,
        chainId,
        connect,
        disconnect,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet(): WalletContextType {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

export default WalletContext;
