import { useState, useEffect, useCallback } from 'react';
import { TOKENS } from '../data';
import { TokenIcon } from '../components/ui';
import { TokenSelectorModal, SlippageSettings, TransactionConfirmModal } from '../components/modals';
import {
    ModeToggle,
    TokenInput,
    SwapArrowButton,
    TWAPSettings,
    LimitSettings,
    SwapDetails,
    PriceImpactWarning,
    SwapSubmitButton,
    SwapChart,
} from '../components/swap';
import { useInputValidation, validateSwap, calculatePriceImpact, useTokenAllowance, useSwapShortcuts } from '../hooks';
import { showTxToast, getErrorInfo, isUserRejection } from '../utils';
import '../styles/swap.css';

// Mock Route Display Component
const MockRouteDisplay = ({ fromToken, toToken, amount }) => {
    // Determine route type based on token pair
    const isSplitRoute = amount > 1000 || (fromToken?.symbol === 'ETH' && toToken?.symbol === 'USDC');
    const isMultiHop = fromToken?.symbol !== 'ETH' && toToken?.symbol !== 'USDC' && toToken?.symbol !== 'USDT';
    
    // Generate mock intermediate tokens for multi-hop
    const getIntermediateToken = () => {
        if (fromToken?.symbol === 'IGNIS') return { symbol: 'WETH', color: '#627EEA', icon: 'W' };
        if (toToken?.symbol === 'IGNIS') return { symbol: 'WETH', color: '#627EEA', icon: 'W' };
        if (fromToken?.isYieldBearing) return { symbol: 'WETH', color: '#627EEA', icon: 'W' };
        return { symbol: 'USDC', color: '#2775CA', icon: '$' };
    };
    
    const intermediate = getIntermediateToken();
    
    return (
        <div className="mock-route-display">
            <div className="mock-route-header">
                <span className="mock-route-title">Route</span>
                <span className="mock-route-meta">
                    {isSplitRoute ? '2 paths • Split' : isMultiHop ? '2 hops' : '1 hop'} 
                    {' • '}<span className="mock-route-savings">Best price</span>
                </span>
            </div>
            
            {isSplitRoute ? (
                <div className="mock-route-split">
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: fromToken?.color || '#627EEA' }}>
                            {fromToken?.icon || fromToken?.symbol?.charAt(0)}
                        </div>
                    </div>
                    <div className="mock-route-paths">
                        <div className="mock-route-path">
                            <span className="mock-route-percent">60%</span>
                            <div className="mock-route-line" />
                            <span className="mock-route-pool mock-route-pool--cl">CL 0.05%</span>
                            <div className="mock-route-line" />
                        </div>
                        <div className="mock-route-path">
                            <span className="mock-route-percent">40%</span>
                            <div className="mock-route-line" />
                            <span className="mock-route-pool mock-route-pool--bin">LB 0.10%</span>
                            <div className="mock-route-line" />
                        </div>
                    </div>
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: toToken?.color || '#2775CA' }}>
                            {toToken?.icon || toToken?.symbol?.charAt(0)}
                        </div>
                    </div>
                </div>
            ) : isMultiHop ? (
                <div className="mock-route-multihop">
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: fromToken?.color || '#627EEA' }}>
                            {fromToken?.icon || fromToken?.symbol?.charAt(0)}
                        </div>
                        <span className="mock-route-symbol">{fromToken?.symbol}</span>
                    </div>
                    <div className="mock-route-line" />
                    <span className="mock-route-pool mock-route-pool--cl">CL 0.30%</span>
                    <div className="mock-route-line" />
                    <div className="mock-route-node">
                        <div className="mock-route-icon mock-route-icon--small" style={{ borderColor: intermediate.color }}>
                            {intermediate.icon}
                        </div>
                        <span className="mock-route-symbol">{intermediate.symbol}</span>
                    </div>
                    <div className="mock-route-line" />
                    <span className="mock-route-pool mock-route-pool--bin">LB 0.05%</span>
                    <div className="mock-route-line" />
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: toToken?.color || '#2775CA' }}>
                            {toToken?.icon || toToken?.symbol?.charAt(0)}
                        </div>
                        <span className="mock-route-symbol">{toToken?.symbol}</span>
                    </div>
                </div>
            ) : (
                <div className="mock-route-single">
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: fromToken?.color || '#627EEA' }}>
                            {fromToken?.icon || fromToken?.symbol?.charAt(0)}
                        </div>
                        <span className="mock-route-symbol">{fromToken?.symbol}</span>
                    </div>
                    <div className="mock-route-line" />
                    <span className="mock-route-pool mock-route-pool--cl">CL 0.05%</span>
                    <div className="mock-route-line" />
                    <div className="mock-route-node">
                        <div className="mock-route-icon" style={{ borderColor: toToken?.color || '#2775CA' }}>
                            {toToken?.icon || toToken?.symbol?.charAt(0)}
                        </div>
                        <span className="mock-route-symbol">{toToken?.symbol}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const SwapPage = ({ isConnected, onConnect, pendingTxs, settings }) => {
    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────
    const [mode, setMode] = useState('swap');
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [tokenModal, setTokenModal] = useState({ open: false, type: null });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    
    // Settings (persisted)
    const [slippage, setSlippage] = useState(settings?.slippage ?? 0.5);
    const [deadline, setDeadline] = useState(settings?.deadline ?? 20);
    
    // TWAP settings
    const [totalTrades, setTotalTrades] = useState(5);
    const [tradeInterval, setTradeInterval] = useState('5');
    
    // Limit settings
    const [limitPrice, setLimitPrice] = useState('');
    const [limitPriceType, setLimitPriceType] = useState('market');
    const [expiry, setExpiry] = useState('24h');

    // Input validation hook
    const fromInput = useInputValidation(fromToken, fromToken?.balance);
    
    // Token approval hook
    const { 
        allowance, 
        isApproving, 
        isLoading: isCheckingAllowance,
        needsApproval, 
        approve,
        isNativeToken,
    } = useTokenAllowance(fromToken, undefined, isConnected);

    // ─────────────────────────────────────────────────────────────────────────
    // COMPUTED VALUES
    // ─────────────────────────────────────────────────────────────────────────
    const rate = fromToken && toToken ? fromToken.price / toToken.price : 0;
    const fromValue = fromInput.numericValue;
    const toValue = fromValue * rate;
    const marketPrice = rate;
    const sizePerTrade = fromValue / totalTrades;
    const priceImpact = calculatePriceImpact(fromValue, fromToken?.balance * 1000, toToken?.balance * 1000);
    const minReceived = toValue * (1 - slippage / 100);

    // Validation
    const validation = validateSwap({
        fromAmount: fromInput.value,
        fromToken,
        toToken,
        fromBalance: fromToken?.balance,
        slippage,
    });

    const requiresApproval = isConnected && validation.isValid && !isNativeToken && needsApproval(fromInput.numericValue);

    // ─────────────────────────────────────────────────────────────────────────
    // EFFECTS
    // ─────────────────────────────────────────────────────────────────────────
    
    // Sync with persisted settings
    useEffect(() => {
        if (settings?.isLoaded) {
            setSlippage(settings.slippage);
            setDeadline(settings.deadline);
        }
    }, [settings?.isLoaded, settings?.slippage, settings?.deadline]);

    // Update limit price when type changes
    useEffect(() => {
        if (limitPriceType === 'market') setLimitPrice(marketPrice.toFixed(6));
        else if (limitPriceType === '+1%') setLimitPrice((marketPrice * 1.01).toFixed(6));
        else if (limitPriceType === '+5%') setLimitPrice((marketPrice * 1.05).toFixed(6));
        else if (limitPriceType === '+10%') setLimitPrice((marketPrice * 1.10).toFixed(6));
    }, [limitPriceType, marketPrice]);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    
    const handleSlippageChange = (value) => {
        setSlippage(value);
        settings?.setSlippage?.(value);
    };
    
    const handleDeadlineChange = (value) => {
        setDeadline(value);
        settings?.setDeadline?.(value);
    };

    const handleSwapTokens = useCallback(() => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        fromInput.clear();
    }, [fromToken, toToken, fromInput]);

    const handleTokenSelect = useCallback((token) => {
        if (tokenModal.type === 'from') {
            if (token.symbol === toToken?.symbol) {
                handleSwapTokens();
            } else {
                setFromToken(token);
            }
        } else {
            if (token.symbol === fromToken?.symbol) {
                handleSwapTokens();
            } else {
                setToToken(token);
            }
        }
        setTokenModal({ open: false, type: null });
    }, [tokenModal.type, fromToken, toToken, handleSwapTokens]);

    const handleApprove = useCallback(async () => {
        if (!fromToken) return;
        
        const toastId = showTxToast.pending(`Approving ${fromToken.symbol}...`);
        const txId = pendingTxs?.addTransaction({
            type: 'approve',
            summary: `Approve ${fromToken.symbol} for trading`,
            fromToken: fromToken.symbol,
        });
        
        try {
            const result = await approve(fromInput.numericValue, true);
            if (result.success) {
                showTxToast.success(`${fromToken.symbol} approved for trading`, result.hash, toastId);
                pendingTxs?.confirmTransaction(txId, result.hash);
            } else {
                throw new Error(result.error || 'Approval failed');
            }
        } catch (error: unknown) {
            const errorInfo = getErrorInfo(error);
            if (!isUserRejection(error)) {
                showTxToast.error?.(errorInfo.title, toastId);
            } else {
                showTxToast.dismiss?.(toastId);
            }
            pendingTxs?.failTransaction(txId, errorInfo.message);
        }
    }, [fromToken, fromInput.numericValue, approve, pendingTxs]);

    const handleSubmit = useCallback(() => {
        if (!isConnected) {
            onConnect();
            return;
        }
        if (!validation.isValid) return;
        if (requiresApproval) {
            handleApprove();
            return;
        }
        setConfirmOpen(true);
    }, [isConnected, onConnect, validation.isValid, requiresApproval, handleApprove]);

    const executeTransaction = useCallback(async () => {
        setIsPending(true);
        const actionText = mode === 'swap' ? 'Swapping' : mode === 'twap' ? 'Placing TWAP order for' : 'Placing limit order for';
        const toastId = showTxToast.pending(`${actionText} ${fromInput.value} ${fromToken?.symbol}...`);
        
        const txId = pendingTxs?.addTransaction({
            type: mode,
            summary: `${fromInput.value} ${fromToken?.symbol} → ${toValue.toFixed(4)} ${toToken?.symbol}`,
            fromToken: fromToken?.symbol,
            toToken: toToken?.symbol,
            fromAmount: fromInput.value,
            toAmount: toValue.toFixed(4),
        });
        
        // Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const txHash = '0x' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);
        const resultText = mode === 'swap' ? 'Swapped' : mode === 'twap' ? 'TWAP order placed:' : 'Limit order placed:';
        
        showTxToast.success(
            `${resultText} ${fromInput.value} ${fromToken?.symbol} → ${toValue.toFixed(4)} ${toToken?.symbol}`,
            txHash,
            toastId
        );
        
        pendingTxs?.confirmTransaction(txId, txHash);
        setIsPending(false);
        setConfirmOpen(false);
        fromInput.clear();
    }, [mode, fromInput, fromToken, toToken, toValue, pendingTxs]);

    // ─────────────────────────────────────────────────────────────────────────
    // BUTTON STATE
    // ─────────────────────────────────────────────────────────────────────────
    const getButtonText = () => {
        if (!isConnected) return 'Connect Wallet';
        if (isCheckingAllowance) return 'Checking allowance...';
        if (isApproving) return `Approving ${fromToken?.symbol}...`;
        if (!validation.isValid) return validation.primaryError || 'Enter amount';
        if (requiresApproval) return `Approve ${fromToken?.symbol}`;
        if (isPending) return 'Confirming...';
        return mode === 'swap' ? 'Swap' : mode === 'twap' ? 'Place TWAP Order' : 'Place Limit Order';
    };
    
    const buttonText = getButtonText();
    const isButtonDisabled = isConnected && (!validation.isValid || isApproving || isCheckingAllowance);

    // Keyboard shortcuts for swap page
    useSwapShortcuts({
        onFlip: handleSwapTokens,
        onMax: () => fromInput.setValue(fromToken?.balance?.toString() || ''),
        onConnect: !isConnected ? onConnect : undefined,
    }, !confirmOpen && !settingsOpen);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="swap-page">
            <div className="swap-card">
                {/* Mode Toggle */}
                <div className="swap-card__header">
                    <ModeToggle 
                        mode={mode} 
                        setMode={setMode} 
                        onSettingsClick={() => setSettingsOpen(true)}
                        isSettingsModified={slippage !== 0.5}
                    />
                </div>

                {/* Price Chart */}
                <SwapChart fromToken={fromToken} toToken={toToken} />

                <div className="swap-card__body">
                    {/* From Token Input */}
                    <TokenInput
                        label={mode === 'limit' ? 'Sell' : 'From'}
                        token={fromToken}
                        value={fromInput.value}
                        onChange={(value) => fromInput.setValue(value)}
                        onTokenSelect={() => setTokenModal({ open: true, type: 'from' })}
                        usdValue={fromInput.usdValue}
                        balance={fromToken?.balance}
                        onMax={fromInput.setMax}
                        error={fromInput.error}
                    />

                    {/* Swap Arrow */}
                    <SwapArrowButton onClick={handleSwapTokens} />

                    {/* To Token Input */}
                    <TokenInput
                        label={mode === 'limit' ? 'Buy' : 'To'}
                        token={toToken}
                        value={toValue ? toValue.toLocaleString(undefined, { maximumFractionDigits: 6 }) : ''}
                        readOnly
                        onTokenSelect={() => setTokenModal({ open: true, type: 'to' })}
                        usdValue={toValue * (toToken?.price || 0)}
                        balance={toToken?.balance}
                    />

                    {/* Price Impact Warning */}
                    <PriceImpactWarning priceImpact={priceImpact} show={fromValue > 0} />

                    {/* TWAP Settings */}
                    {mode === 'twap' && (
                        <TWAPSettings
                            totalTrades={totalTrades}
                            setTotalTrades={setTotalTrades}
                            tradeInterval={tradeInterval}
                            setTradeInterval={setTradeInterval}
                            sizePerTrade={sizePerTrade}
                            fromToken={fromToken}
                        />
                    )}

                    {/* Limit Settings */}
                    {mode === 'limit' && (
                        <LimitSettings
                            limitPrice={limitPrice}
                            setLimitPrice={setLimitPrice}
                            limitPriceType={limitPriceType}
                            setLimitPriceType={setLimitPriceType}
                            expiry={expiry}
                            setExpiry={setExpiry}
                            toToken={toToken}
                        />
                    )}

                    {/* Swap Details */}
                    {fromValue > 0 && (
                        <SwapDetails
                            rate={rate}
                            fromToken={fromToken}
                            toToken={toToken}
                            priceImpact={priceImpact}
                            minReceived={minReceived}
                            slippage={slippage}
                            needsApproval={requiresApproval}
                        />
                    )}

                    {/* Route Display */}
                    {fromValue > 0 && (
                        <MockRouteDisplay 
                            fromToken={fromToken}
                            toToken={toToken}
                            amount={fromValue}
                        />
                    )}

                    {/* Submit Button */}
                    <SwapSubmitButton
                        text={buttonText}
                        onClick={handleSubmit}
                        disabled={isButtonDisabled}
                        isConnected={isConnected}
                        requiresApproval={requiresApproval}
                    />
                </div>
            </div>

            {/* Modals */}
            {tokenModal.open && (
                <TokenSelectorModal
                    isOpen={tokenModal.open}
                    onClose={() => setTokenModal({ open: false, type: null })}
                    onSelect={handleTokenSelect}
                    excludeToken={tokenModal.type === 'from' ? toToken : fromToken}
                />
            )}

            {settingsOpen && (
                <SlippageSettings
                    isOpen={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    slippage={slippage}
                    setSlippage={handleSlippageChange}
                    deadline={deadline}
                    setDeadline={handleDeadlineChange}
                />
            )}

            {confirmOpen && (
                <TransactionConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={executeTransaction}
                    mode={mode}
                    fromToken={fromToken}
                    toToken={toToken}
                    fromAmount={fromInput.value}
                    toAmount={toValue.toFixed(6)}
                    priceImpact={priceImpact}
                    minReceived={minReceived}
                    isPending={isPending}
                />
            )}
        </div>
    );
};
