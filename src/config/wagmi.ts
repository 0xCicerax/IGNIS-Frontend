import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'IGNIS',
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
    chains: [base, baseSepolia],
    ssr: false,
});

// Custom theme colors to match IGNIS branding
export const customTheme = {
    colors: {
        accentColor: '#F5B041',
        accentColorForeground: '#000000',
        actionButtonBorder: 'rgba(255, 255, 255, 0.06)',
        actionButtonBorderMobile: 'rgba(255, 255, 255, 0.06)',
        actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.06)',
        closeButton: '#A3A3A3',
        closeButtonBackground: 'rgba(255, 255, 255, 0.06)',
        connectButtonBackground: '#141416',
        connectButtonBackgroundError: '#EF4444',
        connectButtonInnerBackground: 'linear-gradient(135deg, #F5B041, #D4941C)',
        connectButtonText: '#FFFFFF',
        connectButtonTextError: '#FFFFFF',
        connectionIndicator: '#22C55E',
        downloadBottomCardBackground: '#141416',
        downloadTopCardBackground: '#1A1A1C',
        error: '#EF4444',
        generalBorder: 'rgba(255, 255, 255, 0.06)',
        generalBorderDim: 'rgba(255, 255, 255, 0.03)',
        menuItemBackground: 'rgba(255, 255, 255, 0.06)',
        modalBackdrop: 'rgba(0, 0, 0, 0.92)',
        modalBackground: '#141416',
        modalBorder: 'rgba(255, 255, 255, 0.06)',
        modalText: '#FFFFFF',
        modalTextDim: '#A3A3A3',
        modalTextSecondary: '#8A8A8A',
        profileAction: 'rgba(255, 255, 255, 0.06)',
        profileActionHover: 'rgba(255, 255, 255, 0.1)',
        profileForeground: '#1A1A1C',
        selectedOptionBorder: '#F5B041',
        standby: '#F5B041',
    },
    fonts: {
        body: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    radii: {
        actionButton: '10px',
        connectButton: '10px',
        menuButton: '10px',
        modal: '20px',
        modalMobile: '20px',
    },
    shadows: {
        connectButton: '0 4px 12px rgba(245, 176, 65, 0.15)',
        dialog: '0 8px 32px rgba(0, 0, 0, 0.5)',
        profileDetailsAction: 'none',
        selectedOption: '0 0 0 2px rgba(245, 176, 65, 0.4)',
        selectedWallet: '0 0 0 2px rgba(245, 176, 65, 0.4)',
        walletLogo: 'none',
    },
};
