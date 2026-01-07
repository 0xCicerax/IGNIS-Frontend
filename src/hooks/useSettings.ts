import { useState, useCallback, useEffect } from 'react';
import type { SwapSettings } from '../types';
import { THRESHOLDS } from '../constants';

interface UseSettingsResult extends SwapSettings {
    setSlippage: (value: number) => void;
    setDeadline: (value: number) => void;
    setMevProtection: (value: boolean) => void;
    resetToDefaults: () => void;
}

const STORAGE_KEY = 'ignis-settings';

const defaultSettings: SwapSettings = {
    slippage: THRESHOLDS.slippage.default,
    deadline: 20,
    mevProtection: true,
};

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<SwapSettings>(() => {
        if (typeof window === 'undefined') return defaultSettings;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
            // Ignore localStorage errors
        }
    }, [settings]);

    const setSlippage = useCallback((value: number): void => {
        setSettings(prev => ({ ...prev, slippage: value }));
    }, []);

    const setDeadline = useCallback((value: number): void => {
        setSettings(prev => ({ ...prev, deadline: value }));
    }, []);

    const setMevProtection = useCallback((value: boolean): void => {
        setSettings(prev => ({ ...prev, mevProtection: value }));
    }, []);

    const resetToDefaults = useCallback((): void => {
        setSettings(defaultSettings);
    }, []);

    return {
        ...settings,
        setSlippage,
        setDeadline,
        setMevProtection,
        resetToDefaults,
    };
}
