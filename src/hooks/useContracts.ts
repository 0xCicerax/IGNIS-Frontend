import { useMemo } from 'react';
import { useWallet } from '../contexts';

interface ContractAddresses {
    router: string;
    quoter: string;
    poolManager: string;
    tokenRegistry: string;
}

interface UseContractsResult {
    addresses: ContractAddresses;
    isReady: boolean;
}

const ADDRESSES: Record<number, ContractAddresses> = {
    // Base Mainnet
    8453: {
        router: '0x1234567890123456789012345678901234567890',
        quoter: '0x2345678901234567890123456789012345678901',
        poolManager: '0x3456789012345678901234567890123456789012',
        tokenRegistry: '0x4567890123456789012345678901234567890123',
    },
    // Base Sepolia (testnet)
    84532: {
        router: '0x0987654321098765432109876543210987654321',
        quoter: '0x1098765432109876543210987654321098765432',
        poolManager: '0x2109876543210987654321098765432109876543',
        tokenRegistry: '0x3210987654321098765432109876543210987654',
    },
};

const DEFAULT_ADDRESSES: ContractAddresses = {
    router: '0x0000000000000000000000000000000000000000',
    quoter: '0x0000000000000000000000000000000000000000',
    poolManager: '0x0000000000000000000000000000000000000000',
    tokenRegistry: '0x0000000000000000000000000000000000000000',
};

export function useContracts(): UseContractsResult {
    const { chainId, isConnected } = useWallet();

    const addresses = useMemo((): ContractAddresses => {
        if (!chainId) return DEFAULT_ADDRESSES;
        return ADDRESSES[chainId] || DEFAULT_ADDRESSES;
    }, [chainId]);

    const isReady = isConnected && !!chainId && !!ADDRESSES[chainId];

    return { addresses, isReady };
}
