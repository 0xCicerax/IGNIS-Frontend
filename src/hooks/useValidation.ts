import { useState, useCallback, useMemo } from 'react';
import type { Token } from '../types';

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

interface InputValidation {
  value: string;
  setValue: (v: string) => void;
  error: string | null;
  isValid: boolean;
  reset: () => void;
}

export function useValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((field: string, value: string, rules: { required?: boolean; min?: number; max?: number }) => {
    if (rules.required && !value) {
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }));
      return false;
    }
    if (rules.min !== undefined && parseFloat(value) < rules.min) {
      setErrors(prev => ({ ...prev, [field]: `Minimum value is ${rules.min}` }));
      return false;
    }
    if (rules.max !== undefined && parseFloat(value) > rules.max) {
      setErrors(prev => ({ ...prev, [field]: `Maximum value is ${rules.max}` }));
      return false;
    }
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    return true;
  }, []);

  return { errors, validate, setErrors };
}

export function useInputValidation(token: Token | null, maxBalance?: number): InputValidation {
  const [value, setValue] = useState('');
  
  const { error, isValid } = useMemo(() => {
    if (!value || !token) {
      return { error: null, isValid: false };
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue <= 0) {
      return { error: 'Enter a valid amount', isValid: false };
    }
    
    if (maxBalance !== undefined && numValue > maxBalance) {
      return { error: 'Insufficient balance', isValid: false };
    }
    
    return { error: null, isValid: true };
  }, [value, token, maxBalance]);

  const reset = useCallback(() => setValue(''), []);

  return { value, setValue, error, isValid, reset };
}

interface SwapValidationParams {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  balance: number;
  isConnected: boolean;
}

export function validateSwap(params: SwapValidationParams): ValidationResult {
  const { fromToken, toToken, fromAmount, toAmount, balance, isConnected } = params;
  
  if (!isConnected) {
    return { isValid: false, error: 'Connect wallet to swap' };
  }
  
  if (!fromToken || !toToken) {
    return { isValid: false, error: 'Select tokens' };
  }
  
  if (fromToken.symbol === toToken.symbol) {
    return { isValid: false, error: 'Select different tokens' };
  }
  
  const fromValue = parseFloat(fromAmount);
  if (!fromAmount || isNaN(fromValue) || fromValue <= 0) {
    return { isValid: false, error: 'Enter amount' };
  }
  
  if (fromValue > balance) {
    return { isValid: false, error: 'Insufficient balance' };
  }
  
  return { isValid: true, error: null };
}

export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  spotPrice: number
): number {
  if (!inputAmount || !outputAmount || !spotPrice) return 0;
  
  const expectedOutput = inputAmount * spotPrice;
  if (expectedOutput === 0) return 0;
  
  const impact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
  return Math.max(0, impact);
}

export default useValidation;
