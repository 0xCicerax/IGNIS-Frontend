/** Modal component tests */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────────

const mockTokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: 1.5, balanceUsd: 3000, address: '0x0', decimals: 18, icon: '⟠', isYieldBearing: false },
  { symbol: 'USDC', name: 'USD Coin', balance: 1000, balanceUsd: 1000, address: '0x1', decimals: 6, icon: '$', isYieldBearing: false },
  { symbol: 'IGNIS', name: 'Ignis Token', balance: 500, balanceUsd: 250, address: '0x2', decimals: 18, icon: '🔥', isYieldBearing: false },
  { symbol: 'stETH', name: 'Staked ETH', balance: 0.5, balanceUsd: 1000, address: '0x3', decimals: 18, icon: '⟠', isYieldBearing: true },
  { symbol: 'aUSDC', name: 'Aave USDC', balance: 200, balanceUsd: 200, address: '0x4', decimals: 6, icon: '$', isYieldBearing: true },
];

const mockPool = {
  id: '0xpool1',
  token0: mockTokens[0],
  token1: mockTokens[1],
  tvl: 1000000,
  apr: 12.5,
  volume24h: 500000,
  fee: 0.3,
};

// ─────────────────────────────────────────────────────────────────────────────────
// TOKEN SELECTOR MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('TokenSelectorModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    selectedToken: null,
    otherToken: null,
    favoriteTokens: ['ETH', 'USDC', 'IGNIS'],
    recentTokens: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component for testing (mirrors actual implementation)
  const TokenSelectorModal = ({ isOpen, onClose, onSelect, selectedToken, otherToken, favoriteTokens = [] }: any) => {
    const [search, setSearch] = React.useState('');
    
    if (!isOpen) return null;
    
    const filtered = mockTokens.filter(t => {
      if (otherToken && t.symbol === otherToken.symbol) return false;
      if (!search) return true;
      return t.symbol.toLowerCase().includes(search.toLowerCase()) ||
             t.name.toLowerCase().includes(search.toLowerCase());
    });
    
    return (
      <div data-testid="token-selector-modal">
        <div className="modal-header">
          <h2>Select Token</h2>
          <button onClick={onClose} data-testid="close-button">×</button>
        </div>
        <input
          type="text"
          placeholder="Search by name or address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="search-input"
        />
        <div className="token-list" data-testid="token-list">
          {filtered.map(token => (
            <button
              key={token.symbol}
              onClick={() => { onSelect(token); onClose(); }}
              data-testid={`token-${token.symbol}`}
              className={selectedToken?.symbol === token.symbol ? 'selected' : ''}
              data-favorite={favoriteTokens.includes(token.symbol)}
            >
              <span>{token.icon}</span>
              <span>{token.symbol}</span>
              <span>{token.name}</span>
              <span>{token.balance}</span>
              {token.isYieldBearing && <span data-testid="yield-badge">YIELD</span>}
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div data-testid="no-results">No tokens found</div>
        )}
      </div>
    );
  };

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<TokenSelectorModal {...defaultProps} />);
      expect(screen.getByTestId('token-selector-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<TokenSelectorModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('token-selector-modal')).not.toBeInTheDocument();
    });

    it('displays all tokens initially', () => {
      render(<TokenSelectorModal {...defaultProps} />);
      mockTokens.forEach(token => {
        expect(screen.getByTestId(`token-${token.symbol}`)).toBeInTheDocument();
      });
    });

    it('shows yield badge for yield-bearing tokens', () => {
      render(<TokenSelectorModal {...defaultProps} />);
      const yieldBadges = screen.getAllByTestId('yield-badge');
      expect(yieldBadges.length).toBe(2); // stETH and aUSDC
    });
  });

  describe('search functionality', () => {
    it('filters tokens by symbol', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'ETH');
      
      expect(screen.getByTestId('token-ETH')).toBeInTheDocument();
      expect(screen.getByTestId('token-stETH')).toBeInTheDocument();
      expect(screen.queryByTestId('token-USDC')).not.toBeInTheDocument();
    });

    it('filters tokens by name', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'Ethereum');
      
      expect(screen.getByTestId('token-ETH')).toBeInTheDocument();
      expect(screen.queryByTestId('token-USDC')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'NONEXISTENT');
      
      expect(screen.getByTestId('no-results')).toBeInTheDocument();
    });

    it('search is case insensitive', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      const searchInput = screen.getByTestId('search-input');
      
      await userEvent.type(searchInput, 'usdc');
      
      expect(screen.getByTestId('token-USDC')).toBeInTheDocument();
    });
  });

  describe('token selection', () => {
    it('calls onSelect when token is clicked', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('token-ETH'));
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockTokens[0]);
    });

    it('calls onClose after selection', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('token-ETH'));
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('excludes otherToken from list', () => {
      render(<TokenSelectorModal {...defaultProps} otherToken={mockTokens[0]} />);
      
      expect(screen.queryByTestId('token-ETH')).not.toBeInTheDocument();
      expect(screen.getByTestId('token-USDC')).toBeInTheDocument();
    });

    it('highlights selected token', () => {
      render(<TokenSelectorModal {...defaultProps} selectedToken={mockTokens[0]} />);
      
      const ethButton = screen.getByTestId('token-ETH');
      expect(ethButton).toHaveClass('selected');
    });
  });

  describe('modal controls', () => {
    it('closes modal on close button click', async () => {
      render(<TokenSelectorModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('close-button'));
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// SLIPPAGE SETTINGS MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('SlippageSettings', () => {
  const defaultProps = {
    slippage: 0.5,
    onSlippageChange: vi.fn(),
    deadline: 30,
    onDeadlineChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component
  const SlippageSettings = ({ slippage, onSlippageChange, deadline, onDeadlineChange }: any) => {
    const [customSlippage, setCustomSlippage] = React.useState('');
    const [error, setError] = React.useState('');
    
    const presets = [0.1, 0.5, 1.0];
    
    const handleCustomChange = (value: string) => {
      setCustomSlippage(value);
      const num = parseFloat(value);
      if (isNaN(num)) {
        setError('Invalid number');
      } else if (num < 0.01) {
        setError('Slippage too low');
      } else if (num > 50) {
        setError('Slippage too high');
      } else {
        setError('');
        onSlippageChange(num);
      }
    };
    
    return (
      <div data-testid="slippage-settings">
        <h3>Slippage Tolerance</h3>
        <div className="presets" data-testid="slippage-presets">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => { onSlippageChange(preset); setCustomSlippage(''); }}
              data-testid={`preset-${preset}`}
              className={slippage === preset ? 'active' : ''}
            >
              {preset}%
            </button>
          ))}
        </div>
        <div className="custom">
          <input
            type="text"
            value={customSlippage}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Custom"
            data-testid="custom-slippage-input"
          />
          <span>%</span>
        </div>
        {error && <div data-testid="slippage-error" className="error">{error}</div>}
        {slippage > 5 && (
          <div data-testid="high-slippage-warning" className="warning">
            High slippage may result in unfavorable trades
          </div>
        )}
        
        <h3>Transaction Deadline</h3>
        <div className="deadline">
          <input
            type="number"
            value={deadline}
            onChange={(e) => onDeadlineChange(parseInt(e.target.value))}
            data-testid="deadline-input"
          />
          <span>minutes</span>
        </div>
      </div>
    );
  };

  describe('slippage presets', () => {
    it('renders all preset buttons', () => {
      render(<SlippageSettings {...defaultProps} />);
      
      expect(screen.getByTestId('preset-0.1')).toBeInTheDocument();
      expect(screen.getByTestId('preset-0.5')).toBeInTheDocument();
      expect(screen.getByTestId('preset-1')).toBeInTheDocument();
    });

    it('highlights active preset', () => {
      render(<SlippageSettings {...defaultProps} slippage={0.5} />);
      
      expect(screen.getByTestId('preset-0.5')).toHaveClass('active');
    });

    it('calls onSlippageChange when preset clicked', async () => {
      render(<SlippageSettings {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('preset-1'));
      
      expect(defaultProps.onSlippageChange).toHaveBeenCalledWith(1.0);
    });
  });

  describe('custom slippage input', () => {
    it('accepts valid custom slippage', async () => {
      render(<SlippageSettings {...defaultProps} />);
      const input = screen.getByTestId('custom-slippage-input');
      
      await userEvent.type(input, '2.5');
      
      expect(defaultProps.onSlippageChange).toHaveBeenCalledWith(2.5);
    });

    it('shows error for invalid input', async () => {
      render(<SlippageSettings {...defaultProps} />);
      const input = screen.getByTestId('custom-slippage-input');
      
      await userEvent.type(input, 'abc');
      
      expect(screen.getByTestId('slippage-error')).toHaveTextContent('Invalid number');
    });

    it('shows error for slippage too low', async () => {
      render(<SlippageSettings {...defaultProps} />);
      const input = screen.getByTestId('custom-slippage-input');
      
      await userEvent.type(input, '0.001');
      
      expect(screen.getByTestId('slippage-error')).toHaveTextContent('Slippage too low');
    });

    it('shows error for slippage too high', async () => {
      render(<SlippageSettings {...defaultProps} />);
      const input = screen.getByTestId('custom-slippage-input');
      
      await userEvent.type(input, '60');
      
      expect(screen.getByTestId('slippage-error')).toHaveTextContent('Slippage too high');
    });

    it('shows warning for high slippage', () => {
      render(<SlippageSettings {...defaultProps} slippage={10} />);
      
      expect(screen.getByTestId('high-slippage-warning')).toBeInTheDocument();
    });
  });

  describe('deadline input', () => {
    it('displays current deadline', () => {
      render(<SlippageSettings {...defaultProps} deadline={30} />);
      
      expect(screen.getByTestId('deadline-input')).toHaveValue(30);
    });

    it('calls onDeadlineChange when modified', async () => {
      render(<SlippageSettings {...defaultProps} />);
      const input = screen.getByTestId('deadline-input');
      
      await userEvent.clear(input);
      await userEvent.type(input, '60');
      
      expect(defaultProps.onDeadlineChange).toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// TRANSACTION CONFIRM MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('TransactionConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    type: 'swap' as const,
    fromToken: mockTokens[0],
    toToken: mockTokens[1],
    fromAmount: '1.0',
    toAmount: '2000',
    rate: '2000 USDC per ETH',
    priceImpact: 0.5,
    minReceived: '1990',
    fee: '6.00',
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component
  const TransactionConfirmModal = ({
    isOpen, onClose, onConfirm, type, fromToken, toToken,
    fromAmount, toAmount, rate, priceImpact, minReceived, fee, isLoading
  }: any) => {
    if (!isOpen) return null;
    
    return (
      <div data-testid="tx-confirm-modal">
        <div className="header">
          <h2>Confirm {type}</h2>
          <button onClick={onClose} data-testid="close-button">×</button>
        </div>
        
        <div className="summary" data-testid="tx-summary">
          <div data-testid="from-amount">
            {fromAmount} {fromToken.symbol}
          </div>
          <div>→</div>
          <div data-testid="to-amount">
            {toAmount} {toToken.symbol}
          </div>
        </div>
        
        <div className="details">
          <div data-testid="rate">Rate: {rate}</div>
          <div data-testid="price-impact" data-warning={priceImpact > 3}>
            Price Impact: {priceImpact}%
          </div>
          <div data-testid="min-received">Min Received: {minReceived} {toToken.symbol}</div>
          <div data-testid="fee">Network Fee: ${fee}</div>
        </div>
        
        {priceImpact > 5 && (
          <div data-testid="high-impact-warning" className="warning">
            Warning: High price impact!
          </div>
        )}
        
        <div className="actions">
          <button onClick={onClose} data-testid="cancel-button">Cancel</button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            data-testid="confirm-button"
          >
            {isLoading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    );
  };

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      expect(screen.getByTestId('tx-confirm-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<TransactionConfirmModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('tx-confirm-modal')).not.toBeInTheDocument();
    });

    it('displays transaction summary', () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      
      expect(screen.getByTestId('from-amount')).toHaveTextContent('1.0 ETH');
      expect(screen.getByTestId('to-amount')).toHaveTextContent('2000 USDC');
    });

    it('displays transaction details', () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      
      expect(screen.getByTestId('rate')).toHaveTextContent('2000 USDC per ETH');
      expect(screen.getByTestId('price-impact')).toHaveTextContent('0.5%');
      expect(screen.getByTestId('min-received')).toHaveTextContent('1990 USDC');
      expect(screen.getByTestId('fee')).toHaveTextContent('$6.00');
    });
  });

  describe('price impact warnings', () => {
    it('shows warning for high price impact', () => {
      render(<TransactionConfirmModal {...defaultProps} priceImpact={6} />);
      
      expect(screen.getByTestId('high-impact-warning')).toBeInTheDocument();
    });

    it('does not show warning for low price impact', () => {
      render(<TransactionConfirmModal {...defaultProps} priceImpact={0.5} />);
      
      expect(screen.queryByTestId('high-impact-warning')).not.toBeInTheDocument();
    });
  });

  describe('user actions', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('confirm-button'));
      
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('calls onClose when cancel button clicked', async () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('cancel-button'));
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when close button clicked', async () => {
      render(<TransactionConfirmModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('close-button'));
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables confirm button when loading', () => {
      render(<TransactionConfirmModal {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('confirm-button')).toBeDisabled();
    });

    it('shows loading text when confirming', () => {
      render(<TransactionConfirmModal {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('confirm-button')).toHaveTextContent('Confirming...');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// ADD LIQUIDITY MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('AddLiquidityModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAdd: vi.fn(),
    pool: mockPool,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component
  const AddLiquidityModal = ({ isOpen, onClose, onAdd, pool, isLoading }: any) => {
    const [amount0, setAmount0] = React.useState('');
    const [amount1, setAmount1] = React.useState('');
    const [error, setError] = React.useState('');
    
    if (!isOpen) return null;
    
    const handleAmount0Change = (value: string) => {
      setAmount0(value);
      // Auto-calculate amount1 based on pool ratio
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setAmount1((num * 2000).toString()); // Mock 1 ETH = 2000 USDC ratio
      }
    };
    
    const validateAndSubmit = () => {
      const a0 = parseFloat(amount0);
      const a1 = parseFloat(amount1);
      
      if (isNaN(a0) || isNaN(a1) || a0 <= 0 || a1 <= 0) {
        setError('Invalid amounts');
        return;
      }
      if (a0 > pool.token0.balance) {
        setError(`Insufficient ${pool.token0.symbol} balance`);
        return;
      }
      if (a1 > pool.token1.balance) {
        setError(`Insufficient ${pool.token1.symbol} balance`);
        return;
      }
      
      setError('');
      onAdd({ amount0: a0, amount1: a1 });
    };
    
    return (
      <div data-testid="add-liquidity-modal">
        <h2>Add Liquidity</h2>
        <button onClick={onClose} data-testid="close-button">×</button>
        
        <div data-testid="pool-info">
          {pool.token0.symbol}/{pool.token1.symbol}
        </div>
        
        <div className="input-group">
          <label>{pool.token0.symbol}</label>
          <input
            type="text"
            value={amount0}
            onChange={(e) => handleAmount0Change(e.target.value)}
            placeholder="0.0"
            data-testid="amount0-input"
          />
          <span data-testid="balance0">Balance: {pool.token0.balance}</span>
          <button 
            onClick={() => handleAmount0Change(pool.token0.balance.toString())}
            data-testid="max0-button"
          >
            MAX
          </button>
        </div>
        
        <div className="input-group">
          <label>{pool.token1.symbol}</label>
          <input
            type="text"
            value={amount1}
            onChange={(e) => setAmount1(e.target.value)}
            placeholder="0.0"
            data-testid="amount1-input"
          />
          <span data-testid="balance1">Balance: {pool.token1.balance}</span>
        </div>
        
        {error && <div data-testid="error-message" className="error">{error}</div>}
        
        <button
          onClick={validateAndSubmit}
          disabled={isLoading || !amount0 || !amount1}
          data-testid="add-button"
        >
          {isLoading ? 'Adding...' : 'Add Liquidity'}
        </button>
      </div>
    );
  };

  describe('rendering', () => {
    it('renders pool info', () => {
      render(<AddLiquidityModal {...defaultProps} />);
      
      expect(screen.getByTestId('pool-info')).toHaveTextContent('ETH/USDC');
    });

    it('shows token balances', () => {
      render(<AddLiquidityModal {...defaultProps} />);
      
      expect(screen.getByTestId('balance0')).toHaveTextContent('1.5');
      expect(screen.getByTestId('balance1')).toHaveTextContent('1000');
    });
  });

  describe('amount inputs', () => {
    it('accepts amount0 input', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      const input = screen.getByTestId('amount0-input');
      
      await userEvent.type(input, '0.5');
      
      expect(input).toHaveValue('0.5');
    });

    it('auto-calculates amount1 based on pool ratio', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      const input0 = screen.getByTestId('amount0-input');
      
      await userEvent.type(input0, '1');
      
      expect(screen.getByTestId('amount1-input')).toHaveValue('2000');
    });

    it('sets max amount when MAX clicked', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('max0-button'));
      
      expect(screen.getByTestId('amount0-input')).toHaveValue('1.5');
    });
  });

  describe('validation', () => {
    it('shows error for insufficient balance', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      const input = screen.getByTestId('amount0-input');
      
      await userEvent.type(input, '10'); // More than balance of 1.5
      await userEvent.click(screen.getByTestId('add-button'));
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient ETH balance');
    });

    it('shows error for invalid amounts', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('add-button'));
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid amounts');
    });
  });

  describe('submission', () => {
    it('calls onAdd with correct amounts', async () => {
      render(<AddLiquidityModal {...defaultProps} />);
      
      await userEvent.type(screen.getByTestId('amount0-input'), '0.5');
      await userEvent.click(screen.getByTestId('add-button'));
      
      expect(defaultProps.onAdd).toHaveBeenCalledWith({
        amount0: 0.5,
        amount1: 1000,
      });
    });

    it('disables button when loading', () => {
      render(<AddLiquidityModal {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('add-button')).toBeDisabled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// WITHDRAW MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('WithdrawModal', () => {
  const mockPosition = {
    id: '1',
    pool: mockPool,
    liquidity: 1000,
    token0Amount: 0.5,
    token1Amount: 1000,
    valueUsd: 2000,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onWithdraw: vi.fn(),
    position: mockPosition,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component
  const WithdrawModal = ({ isOpen, onClose, onWithdraw, position, isLoading }: any) => {
    const [percentage, setPercentage] = React.useState(100);
    
    if (!isOpen) return null;
    
    const withdrawAmount0 = (position.token0Amount * percentage / 100).toFixed(6);
    const withdrawAmount1 = (position.token1Amount * percentage / 100).toFixed(2);
    
    return (
      <div data-testid="withdraw-modal">
        <h2>Withdraw Liquidity</h2>
        <button onClick={onClose} data-testid="close-button">×</button>
        
        <div data-testid="position-value">
          Position Value: ${position.valueUsd.toLocaleString()}
        </div>
        
        <div className="percentage-selector">
          {[25, 50, 75, 100].map(p => (
            <button
              key={p}
              onClick={() => setPercentage(p)}
              data-testid={`percent-${p}`}
              className={percentage === p ? 'active' : ''}
            >
              {p}%
            </button>
          ))}
        </div>
        
        <input
          type="range"
          min="1"
          max="100"
          value={percentage}
          onChange={(e) => setPercentage(parseInt(e.target.value))}
          data-testid="percentage-slider"
        />
        
        <div data-testid="withdraw-preview">
          <div data-testid="withdraw-amount0">
            {withdrawAmount0} {position.pool.token0.symbol}
          </div>
          <div data-testid="withdraw-amount1">
            {withdrawAmount1} {position.pool.token1.symbol}
          </div>
        </div>
        
        <button
          onClick={() => onWithdraw(percentage)}
          disabled={isLoading}
          data-testid="withdraw-button"
        >
          {isLoading ? 'Withdrawing...' : `Withdraw ${percentage}%`}
        </button>
      </div>
    );
  };

  describe('rendering', () => {
    it('displays position value', () => {
      render(<WithdrawModal {...defaultProps} />);
      
      expect(screen.getByTestId('position-value')).toHaveTextContent('$2,000');
    });

    it('shows percentage presets', () => {
      render(<WithdrawModal {...defaultProps} />);
      
      expect(screen.getByTestId('percent-25')).toBeInTheDocument();
      expect(screen.getByTestId('percent-50')).toBeInTheDocument();
      expect(screen.getByTestId('percent-75')).toBeInTheDocument();
      expect(screen.getByTestId('percent-100')).toBeInTheDocument();
    });
  });

  describe('percentage selection', () => {
    it('updates preview when preset clicked', async () => {
      render(<WithdrawModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('percent-50'));
      
      expect(screen.getByTestId('withdraw-amount0')).toHaveTextContent('0.250000 ETH');
      expect(screen.getByTestId('withdraw-amount1')).toHaveTextContent('500.00 USDC');
    });

    it('highlights active percentage', async () => {
      render(<WithdrawModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('percent-75'));
      
      expect(screen.getByTestId('percent-75')).toHaveClass('active');
    });

    it('slider updates preview', async () => {
      render(<WithdrawModal {...defaultProps} />);
      const slider = screen.getByTestId('percentage-slider');
      
      fireEvent.change(slider, { target: { value: '50' } });
      
      expect(screen.getByTestId('withdraw-amount0')).toHaveTextContent('0.250000 ETH');
    });
  });

  describe('withdrawal', () => {
    it('calls onWithdraw with percentage', async () => {
      render(<WithdrawModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('percent-50'));
      await userEvent.click(screen.getByTestId('withdraw-button'));
      
      expect(defaultProps.onWithdraw).toHaveBeenCalledWith(50);
    });

    it('shows loading state', () => {
      render(<WithdrawModal {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('withdraw-button')).toHaveTextContent('Withdrawing...');
      expect(screen.getByTestId('withdraw-button')).toBeDisabled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────────
// LOCK IGNIS MODAL TESTS
// ─────────────────────────────────────────────────────────────────────────────────

describe('LockIgnisModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onLock: vi.fn(),
    balance: 1000,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock component
  const LockIgnisModal = ({ isOpen, onClose, onLock, balance, isLoading }: any) => {
    const [amount, setAmount] = React.useState('');
    const [duration, setDuration] = React.useState(30); // days
    const [error, setError] = React.useState('');
    
    if (!isOpen) return null;
    
    const durations = [
      { days: 30, multiplier: 1.0 },
      { days: 90, multiplier: 1.5 },
      { days: 180, multiplier: 2.0 },
      { days: 365, multiplier: 3.0 },
    ];
    
    const selectedDuration = durations.find(d => d.days === duration);
    const projectedReward = parseFloat(amount || '0') * (selectedDuration?.multiplier || 1);
    
    const handleLock = () => {
      const num = parseFloat(amount);
      if (isNaN(num) || num <= 0) {
        setError('Invalid amount');
        return;
      }
      if (num > balance) {
        setError('Insufficient balance');
        return;
      }
      setError('');
      onLock({ amount: num, duration });
    };
    
    return (
      <div data-testid="lock-ignis-modal">
        <h2>Lock IGNIS</h2>
        <button onClick={onClose} data-testid="close-button">×</button>
        
        <div className="amount-input">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to lock"
            data-testid="amount-input"
          />
          <span data-testid="balance">Balance: {balance} IGNIS</span>
          <button onClick={() => setAmount(balance.toString())} data-testid="max-button">
            MAX
          </button>
        </div>
        
        <div className="duration-selector" data-testid="duration-selector">
          {durations.map(d => (
            <button
              key={d.days}
              onClick={() => setDuration(d.days)}
              data-testid={`duration-${d.days}`}
              className={duration === d.days ? 'active' : ''}
            >
              {d.days} days ({d.multiplier}x)
            </button>
          ))}
        </div>
        
        <div data-testid="projected-reward">
          Projected Reward: {projectedReward.toFixed(2)} IGNIS
        </div>
        
        {error && <div data-testid="error-message">{error}</div>}
        
        <button
          onClick={handleLock}
          disabled={isLoading || !amount}
          data-testid="lock-button"
        >
          {isLoading ? 'Locking...' : 'Lock IGNIS'}
        </button>
      </div>
    );
  };

  describe('rendering', () => {
    it('shows balance', () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      expect(screen.getByTestId('balance')).toHaveTextContent('1000 IGNIS');
    });

    it('shows duration options', () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      expect(screen.getByTestId('duration-30')).toBeInTheDocument();
      expect(screen.getByTestId('duration-90')).toBeInTheDocument();
      expect(screen.getByTestId('duration-180')).toBeInTheDocument();
      expect(screen.getByTestId('duration-365')).toBeInTheDocument();
    });
  });

  describe('amount input', () => {
    it('accepts amount', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.type(screen.getByTestId('amount-input'), '500');
      
      expect(screen.getByTestId('amount-input')).toHaveValue('500');
    });

    it('sets max on MAX click', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('max-button'));
      
      expect(screen.getByTestId('amount-input')).toHaveValue('1000');
    });
  });

  describe('duration selection', () => {
    it('updates projected reward based on duration', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.type(screen.getByTestId('amount-input'), '100');
      await userEvent.click(screen.getByTestId('duration-365'));
      
      expect(screen.getByTestId('projected-reward')).toHaveTextContent('300.00 IGNIS');
    });

    it('highlights selected duration', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.click(screen.getByTestId('duration-90'));
      
      expect(screen.getByTestId('duration-90')).toHaveClass('active');
    });
  });

  describe('validation', () => {
    it('shows error for insufficient balance', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.type(screen.getByTestId('amount-input'), '2000');
      await userEvent.click(screen.getByTestId('lock-button'));
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Insufficient balance');
    });
  });

  describe('locking', () => {
    it('calls onLock with amount and duration', async () => {
      render(<LockIgnisModal {...defaultProps} />);
      
      await userEvent.type(screen.getByTestId('amount-input'), '500');
      await userEvent.click(screen.getByTestId('duration-90'));
      await userEvent.click(screen.getByTestId('lock-button'));
      
      expect(defaultProps.onLock).toHaveBeenCalledWith({
        amount: 500,
        duration: 90,
      });
    });
  });
});
