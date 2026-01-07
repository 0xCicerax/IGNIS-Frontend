/** Swap flow integration tests */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const mockTokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: 1.5, balanceUsd: 3000, address: '0x0', decimals: 18, icon: '⟠' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1000, balanceUsd: 1000, address: '0x1', decimals: 6, icon: '$' },
  { symbol: 'IGNIS', name: 'Ignis Token', balance: 500, balanceUsd: 250, address: '0x2', decimals: 18, icon: '🔥' },
];

const mockQuote = {
  expectedAmountOut: '1980.50',
  minAmountOut: '1960.70',
  priceImpact: 0.25,
  route: ['ETH', 'USDC'],
  fee: '0.30',
  gasEstimate: '150000',
  gasPrice: '50',
  gasCostUsd: '6.50',
};

const mockHighImpactQuote = {
  ...mockQuote,
  priceImpact: 8.5,
  expectedAmountOut: '1820.00',
};

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK SWAP PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

interface SwapState {
  fromToken: typeof mockTokens[0] | null;
  toToken: typeof mockTokens[0] | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  quote: typeof mockQuote | null;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  error: string;
  txHash: string;
  showTokenSelector: 'from' | 'to' | null;
  showSlippageSettings: boolean;
  showConfirmModal: boolean;
}

const SwapPage = ({ onSwapSuccess = vi.fn(), onSwapError = vi.fn() }) => {
  const [state, setState] = React.useState<SwapState>({
    fromToken: mockTokens[0],
    toToken: mockTokens[1],
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
    quote: null,
    isLoadingQuote: false,
    isSwapping: false,
    error: '',
    txHash: '',
    showTokenSelector: null,
    showSlippageSettings: false,
    showConfirmModal: false,
  });

  // Simulate quote fetching
  const fetchQuote = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setState(s => ({ ...s, quote: null, toAmount: '' }));
      return;
    }

    setState(s => ({ ...s, isLoadingQuote: true, error: '' }));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const amountNum = parseFloat(amount);
    if (amountNum > 10) {
      // High amount = high price impact
      setState(s => ({
        ...s,
        isLoadingQuote: false,
        quote: mockHighImpactQuote,
        toAmount: mockHighImpactQuote.expectedAmountOut,
      }));
    } else {
      setState(s => ({
        ...s,
        isLoadingQuote: false,
        quote: mockQuote,
        toAmount: (amountNum * 1980.5).toFixed(2),
      }));
    }
  };

  const handleFromAmountChange = async (value: string) => {
    setState(s => ({ ...s, fromAmount: value }));
    await fetchQuote(value);
  };

  const handleSwapTokens = () => {
    setState(s => ({
      ...s,
      fromToken: s.toToken,
      toToken: s.fromToken,
      fromAmount: s.toAmount,
      toAmount: s.fromAmount,
    }));
  };

  const validateSwap = (): string | null => {
    if (!state.fromToken || !state.toToken) return 'Select tokens';
    if (!state.fromAmount || parseFloat(state.fromAmount) <= 0) return 'Enter amount';
    if (parseFloat(state.fromAmount) > state.fromToken.balance) return 'Insufficient balance';
    if (!state.quote) return 'Loading quote...';
    return null;
  };

  const handleSwap = async () => {
    const error = validateSwap();
    if (error) {
      setState(s => ({ ...s, error }));
      return;
    }

    setState(s => ({ ...s, showConfirmModal: true }));
  };

  const executeSwap = async () => {
    setState(s => ({ ...s, isSwapping: true, showConfirmModal: false }));
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 90% success rate for testing
    if (Math.random() > 0.1) {
      const txHash = '0x' + Math.random().toString(16).slice(2, 66);
      setState(s => ({ ...s, isSwapping: false, txHash, fromAmount: '', toAmount: '' }));
      onSwapSuccess(txHash);
    } else {
      setState(s => ({ ...s, isSwapping: false, error: 'Transaction failed' }));
      onSwapError('Transaction failed');
    }
  };

  const buttonText = () => {
    if (state.isSwapping) return 'Swapping...';
    if (state.isLoadingQuote) return 'Loading...';
    const error = validateSwap();
    if (error) return error;
    return 'Swap';
  };

  return (
    <div data-testid="swap-page">
      {/* From Token */}
      <div className="token-input" data-testid="from-section">
        <label>From</label>
        <button
          onClick={() => setState(s => ({ ...s, showTokenSelector: 'from' }))}
          data-testid="from-token-button"
        >
          {state.fromToken ? (
            <>
              <span>{state.fromToken.icon}</span>
              <span>{state.fromToken.symbol}</span>
            </>
          ) : (
            'Select token'
          )}
        </button>
        <input
          type="text"
          value={state.fromAmount}
          onChange={(e) => handleFromAmountChange(e.target.value)}
          placeholder="0.0"
          data-testid="from-amount-input"
        />
        {state.fromToken && (
          <div data-testid="from-balance">
            Balance: {state.fromToken.balance}
            <button
              onClick={() => handleFromAmountChange(state.fromToken!.balance.toString())}
              data-testid="max-button"
            >
              MAX
            </button>
          </div>
        )}
      </div>

      {/* Swap Direction Button */}
      <button onClick={handleSwapTokens} data-testid="swap-direction-button">
        ↕
      </button>

      {/* To Token */}
      <div className="token-input" data-testid="to-section">
        <label>To</label>
        <button
          onClick={() => setState(s => ({ ...s, showTokenSelector: 'to' }))}
          data-testid="to-token-button"
        >
          {state.toToken ? (
            <>
              <span>{state.toToken.icon}</span>
              <span>{state.toToken.symbol}</span>
            </>
          ) : (
            'Select token'
          )}
        </button>
        <input
          type="text"
          value={state.toAmount}
          readOnly
          placeholder="0.0"
          data-testid="to-amount-input"
        />
        {state.isLoadingQuote && <span data-testid="loading-indicator">Loading...</span>}
      </div>

      {/* Slippage Settings */}
      <div className="settings">
        <button
          onClick={() => setState(s => ({ ...s, showSlippageSettings: !s.showSlippageSettings }))}
          data-testid="slippage-button"
        >
          Slippage: {state.slippage}%
        </button>
        {state.showSlippageSettings && (
          <div data-testid="slippage-panel">
            {[0.1, 0.5, 1.0].map(val => (
              <button
                key={val}
                onClick={() => setState(s => ({ ...s, slippage: val }))}
                data-testid={`slippage-${val}`}
                className={state.slippage === val ? 'active' : ''}
              >
                {val}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quote Details */}
      {state.quote && (
        <div data-testid="quote-details">
          <div data-testid="rate">
            1 {state.fromToken?.symbol} = {(parseFloat(state.toAmount) / parseFloat(state.fromAmount)).toFixed(2)} {state.toToken?.symbol}
          </div>
          <div data-testid="price-impact" data-warning={state.quote.priceImpact > 3}>
            Price Impact: {state.quote.priceImpact}%
          </div>
          <div data-testid="min-received">
            Min Received: {state.quote.minAmountOut} {state.toToken?.symbol}
          </div>
          <div data-testid="gas-cost">
            Gas: ~${state.quote.gasCostUsd}
          </div>
        </div>
      )}

      {/* Price Impact Warning */}
      {state.quote && state.quote.priceImpact > 5 && (
        <div data-testid="high-impact-warning" className="warning">
          ⚠️ High price impact! You may receive significantly less tokens.
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div data-testid="error-message" className="error">
          {state.error}
        </div>
      )}

      {/* Success Message */}
      {state.txHash && (
        <div data-testid="success-message">
          Swap successful! TX: {state.txHash.slice(0, 10)}...
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={state.isSwapping || state.isLoadingQuote || !!validateSwap()}
        data-testid="swap-button"
      >
        {buttonText()}
      </button>

      {/* Token Selector Modal */}
      {state.showTokenSelector && (
        <div data-testid="token-selector-modal">
          <button
            onClick={() => setState(s => ({ ...s, showTokenSelector: null }))}
            data-testid="close-selector"
          >
            ×
          </button>
          {mockTokens
            .filter(t => {
              if (state.showTokenSelector === 'from') return t.symbol !== state.toToken?.symbol;
              return t.symbol !== state.fromToken?.symbol;
            })
            .map(token => (
              <button
                key={token.symbol}
                onClick={() => {
                  if (state.showTokenSelector === 'from') {
                    setState(s => ({ ...s, fromToken: token, showTokenSelector: null }));
                  } else {
                    setState(s => ({ ...s, toToken: token, showTokenSelector: null }));
                  }
                }}
                data-testid={`select-${token.symbol}`}
              >
                {token.icon} {token.symbol}
              </button>
            ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {state.showConfirmModal && (
        <div data-testid="confirm-modal">
          <h3>Confirm Swap</h3>
          <div data-testid="confirm-summary">
            {state.fromAmount} {state.fromToken?.symbol} → {state.toAmount} {state.toToken?.symbol}
          </div>
          <div data-testid="confirm-impact">
            Price Impact: {state.quote?.priceImpact}%
          </div>
          <button
            onClick={() => setState(s => ({ ...s, showConfirmModal: false }))}
            data-testid="cancel-swap"
          >
            Cancel
          </button>
          <button onClick={executeSwap} data-testid="confirm-swap">
            Confirm Swap
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// INTEGRATION TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('Swap Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Selection', () => {
    it('opens token selector when clicking from token', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('from-token-button'));
      
      expect(screen.getByTestId('token-selector-modal')).toBeInTheDocument();
    });

    it('opens token selector when clicking to token', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('to-token-button'));
      
      expect(screen.getByTestId('token-selector-modal')).toBeInTheDocument();
    });

    it('selects from token and closes modal', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('from-token-button'));
      await userEvent.click(screen.getByTestId('select-IGNIS'));
      
      expect(screen.queryByTestId('token-selector-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('from-token-button')).toHaveTextContent('IGNIS');
    });

    it('selects to token and closes modal', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('to-token-button'));
      await userEvent.click(screen.getByTestId('select-IGNIS'));
      
      expect(screen.getByTestId('to-token-button')).toHaveTextContent('IGNIS');
    });

    it('excludes already selected token from opposite selector', async () => {
      render(<SwapPage />);
      
      // ETH is already selected as from token
      await userEvent.click(screen.getByTestId('to-token-button'));
      
      expect(screen.queryByTestId('select-ETH')).not.toBeInTheDocument();
      expect(screen.getByTestId('select-IGNIS')).toBeInTheDocument();
    });

    it('swaps token positions when clicking swap button', async () => {
      render(<SwapPage />);
      
      const fromBefore = screen.getByTestId('from-token-button').textContent;
      const toBefore = screen.getByTestId('to-token-button').textContent;
      
      await userEvent.click(screen.getByTestId('swap-direction-button'));
      
      expect(screen.getByTestId('from-token-button')).toHaveTextContent(toBefore!);
      expect(screen.getByTestId('to-token-button')).toHaveTextContent(fromBefore!);
    });
  });

  describe('Amount Input and Validation', () => {
    it('accepts numeric input for from amount', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1.5');
      
      expect(screen.getByTestId('from-amount-input')).toHaveValue('1.5');
    });

    it('shows balance for from token', () => {
      render(<SwapPage />);
      
      expect(screen.getByTestId('from-balance')).toHaveTextContent('1.5');
    });

    it('sets max amount when MAX clicked', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('max-button'));
      
      expect(screen.getByTestId('from-amount-input')).toHaveValue('1.5');
    });

    it('shows insufficient balance error', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '10');
      await userEvent.click(screen.getByTestId('swap-button'));
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient balance');
    });

    it('shows "Enter amount" when amount is empty', () => {
      render(<SwapPage />);
      
      expect(screen.getByTestId('swap-button')).toHaveTextContent('Enter amount');
    });
  });

  describe('Quote Fetching and Display', () => {
    it('shows loading indicator while fetching quote', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      
      // Check loading state appears briefly
      expect(screen.getByTestId('swap-button')).toHaveTextContent('Loading...');
    });

    it('displays quote details after fetching', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      
      await waitFor(() => {
        expect(screen.getByTestId('quote-details')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('price-impact')).toBeInTheDocument();
      expect(screen.getByTestId('min-received')).toBeInTheDocument();
      expect(screen.getByTestId('gas-cost')).toBeInTheDocument();
    });

    it('updates to amount based on quote', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      
      await waitFor(() => {
        expect(screen.getByTestId('to-amount-input')).not.toHaveValue('');
      });
    });

    it('clears quote when amount is cleared', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      
      await userEvent.clear(screen.getByTestId('from-amount-input'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('quote-details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Slippage Settings', () => {
    it('opens slippage panel when clicked', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('slippage-button'));
      
      expect(screen.getByTestId('slippage-panel')).toBeInTheDocument();
    });

    it('displays current slippage', () => {
      render(<SwapPage />);
      
      expect(screen.getByTestId('slippage-button')).toHaveTextContent('0.5%');
    });

    it('changes slippage when preset clicked', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('slippage-button'));
      await userEvent.click(screen.getByTestId('slippage-1'));
      
      expect(screen.getByTestId('slippage-button')).toHaveTextContent('1%');
    });

    it('highlights active slippage preset', async () => {
      render(<SwapPage />);
      
      await userEvent.click(screen.getByTestId('slippage-button'));
      
      expect(screen.getByTestId('slippage-0.5')).toHaveClass('active');
    });
  });

  describe('Price Impact Warnings', () => {
    it('shows warning for high price impact', async () => {
      render(<SwapPage />);
      
      // High amount triggers high price impact quote
      await userEvent.type(screen.getByTestId('from-amount-input'), '15');
      
      await waitFor(() => {
        expect(screen.getByTestId('high-impact-warning')).toBeInTheDocument();
      });
    });

    it('does not show warning for low price impact', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      
      await waitFor(() => {
        expect(screen.getByTestId('quote-details')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('high-impact-warning')).not.toBeInTheDocument();
    });

    it('marks price impact as warning when > 3%', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '15');
      
      await waitFor(() => {
        expect(screen.getByTestId('price-impact')).toHaveAttribute('data-warning', 'true');
      });
    });
  });

  describe('Transaction Confirmation', () => {
    it('opens confirmation modal when swap clicked', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      
      await userEvent.click(screen.getByTestId('swap-button'));
      
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });

    it('shows transaction summary in confirmation', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      
      expect(screen.getByTestId('confirm-summary')).toHaveTextContent('ETH');
      expect(screen.getByTestId('confirm-summary')).toHaveTextContent('USDC');
    });

    it('closes confirmation modal on cancel', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('cancel-swap'));
      
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
    });
  });

  describe('Success and Error States', () => {
    it('shows success message after successful swap', async () => {
      // Mock Math.random to ensure success
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });
      
      vi.restoreAllMocks();
    });

    it('clears amounts after successful swap', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      await waitFor(() => {
        expect(screen.getByTestId('from-amount-input')).toHaveValue('');
      });
      
      vi.restoreAllMocks();
    });

    it('calls onSwapSuccess callback', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const onSuccess = vi.fn();
      
      render(<SwapPage onSwapSuccess={onSuccess} />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
      
      vi.restoreAllMocks();
    });

    it('shows error message on failed swap', async () => {
      // Mock Math.random to ensure failure
      vi.spyOn(Math, 'random').mockReturnValue(0.95);
      
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Transaction failed');
      });
      
      vi.restoreAllMocks();
    });
  });

  describe('Button States', () => {
    it('disables swap button when loading quote', async () => {
      render(<SwapPage />);
      
      const input = screen.getByTestId('from-amount-input');
      fireEvent.change(input, { target: { value: '1' } });
      
      // Button should be disabled during loading
      expect(screen.getByTestId('swap-button')).toBeDisabled();
    });

    it('disables swap button during swap execution', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      await waitFor(() => expect(screen.getByTestId('quote-details')).toBeInTheDocument());
      await userEvent.click(screen.getByTestId('swap-button'));
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      expect(screen.getByTestId('swap-button')).toHaveTextContent('Swapping...');
    });

    it('enables swap button when valid quote available', async () => {
      render(<SwapPage />);
      
      await userEvent.type(screen.getByTestId('from-amount-input'), '1');
      
      await waitFor(() => {
        expect(screen.getByTestId('swap-button')).not.toBeDisabled();
        expect(screen.getByTestId('swap-button')).toHaveTextContent('Swap');
      });
    });
  });

  describe('Complete Swap Flow', () => {
    it('completes full swap flow from token selection to confirmation', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const onSuccess = vi.fn();
      
      render(<SwapPage onSwapSuccess={onSuccess} />);
      
      // 1. Select from token (change from default)
      await userEvent.click(screen.getByTestId('from-token-button'));
      await userEvent.click(screen.getByTestId('select-IGNIS'));
      expect(screen.getByTestId('from-token-button')).toHaveTextContent('IGNIS');
      
      // 2. Select to token (change from default)
      await userEvent.click(screen.getByTestId('to-token-button'));
      await userEvent.click(screen.getByTestId('select-ETH'));
      expect(screen.getByTestId('to-token-button')).toHaveTextContent('ETH');
      
      // 3. Enter amount
      await userEvent.type(screen.getByTestId('from-amount-input'), '100');
      
      // 4. Wait for quote
      await waitFor(() => {
        expect(screen.getByTestId('quote-details')).toBeInTheDocument();
      });
      
      // 5. Adjust slippage
      await userEvent.click(screen.getByTestId('slippage-button'));
      await userEvent.click(screen.getByTestId('slippage-1'));
      expect(screen.getByTestId('slippage-button')).toHaveTextContent('1%');
      
      // 6. Click swap
      await userEvent.click(screen.getByTestId('swap-button'));
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      
      // 7. Confirm swap
      await userEvent.click(screen.getByTestId('confirm-swap'));
      
      // 8. Verify success
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });
      
      vi.restoreAllMocks();
    });
  });
});
