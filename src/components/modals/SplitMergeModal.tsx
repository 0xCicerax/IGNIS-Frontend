import { useState, useMemo, useEffect } from 'react';
import { useVeIGNISplit, useVeIGNIMerge, validateSplit, validateMerge } from '../../hooks/useVeIGNI';
import type { UserLock, TokenConfig } from '../../types/veIGNI';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SplitMergeModalProps {
    isOpen: boolean;
    onClose: () => void;
    locks: UserLock[];
    tokens: TokenConfig;
    contractAddress: `0x${string}`;
    onSuccess?: () => void;
    formatNumber?: (num: number) => string;
}

type ModalMode = 'select' | 'split' | 'merge';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MIN_LOCK_AMOUNT = BigInt('1000000000000000000'); // 1e18

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const defaultFormatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────

const SplitIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5"/>
        <path d="M8 3H3v5"/>
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
        <path d="m15 9 6-6"/>
    </svg>
);

const MergeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 6 4-4 4 4"/>
        <path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/>
        <path d="m20 22-5-5"/>
    </svg>
);

const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
    </svg>
);

const BackIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
    </svg>
);

const WarningIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const SplitMergeModal: React.FC<SplitMergeModalProps> = ({
    isOpen,
    onClose,
    locks,
    tokens,
    contractAddress,
    onSuccess,
    formatNumber = defaultFormatNumber,
}) => {
    const [mode, setMode] = useState<ModalMode>('select');
    const [selectedLocks, setSelectedLocks] = useState<string[]>([]);
    const [splitRatio, setSplitRatio] = useState(50);
    const [error, setError] = useState<string | null>(null);

    const { baseToken, votingToken, decimals = 18 } = tokens;

    // Contract hooks
    const {
        splitByRatio,
        isPending: isSplitPending,
        isConfirming: isSplitConfirming,
        isSuccess: isSplitSuccess,
        error: splitError,
        reset: resetSplit,
    } = useVeIGNISplit({
        contractAddress,
        onSuccess: () => {
            onSuccess?.();
            handleClose();
        },
    });

    const {
        merge,
        isPending: isMergePending,
        isConfirming: isMergeConfirming,
        isSuccess: isMergeSuccess,
        error: mergeError,
        reset: resetMerge,
    } = useVeIGNIMerge({
        contractAddress,
        onSuccess: () => {
            onSuccess?.();
            handleClose();
        },
    });

    const isPending = isSplitPending || isMergePending || isSplitConfirming || isMergeConfirming;

    // Reset on success
    useEffect(() => {
        if (isSplitSuccess || isMergeSuccess) {
            onSuccess?.();
            handleClose();
        }
    }, [isSplitSuccess, isMergeSuccess]);

    // Filter out locks that can be used
    const availableLocks = useMemo(() => {
        return locks.filter(lock => !lock.hasVoted);
    }, [locks]);

    const votedLocks = useMemo(() => {
        return locks.filter(lock => lock.hasVoted);
    }, [locks]);

    // Selected lock for split mode
    const selectedLockForSplit = useMemo(() =>
        availableLocks.find(l => l.id === selectedLocks[0]),
        [availableLocks, selectedLocks]
    );

    // Selected locks for merge mode
    const selectedLocksForMerge = useMemo(() =>
        availableLocks.filter(l => selectedLocks.includes(l.id)),
        [availableLocks, selectedLocks]
    );

    // Validate merge - first selected lock is the target
    const mergeValidation = useMemo(() => {
        if (selectedLocksForMerge.length < 2) {
            return { valid: false, error: 'Select at least 2 positions' };
        }
        return validateMerge(selectedLocksForMerge, 0); // First selected is target
    }, [selectedLocksForMerge]);

    // Calculate split amounts
    const splitResult = useMemo(() => {
        if (!selectedLockForSplit) return null;

        const splitAmount = (selectedLockForSplit.lockedAmountRaw * BigInt(splitRatio)) / BigInt(100);
        const remainingAmount = selectedLockForSplit.lockedAmountRaw - splitAmount;

        const validation = validateSplit(selectedLockForSplit.lockedAmountRaw, splitAmount);

        const lock1Amount = Number(remainingAmount) / 10 ** decimals;
        const lock2Amount = Number(splitAmount) / 10 ** decimals;

        // Estimate voting power proportionally
        const lock1VotingPower = selectedLockForSplit.votingPower * ((100 - splitRatio) / 100);
        const lock2VotingPower = selectedLockForSplit.votingPower * (splitRatio / 100);

        return {
            lock1: { amount: lock1Amount, votingPower: lock1VotingPower, raw: remainingAmount },
            lock2: { amount: lock2Amount, votingPower: lock2VotingPower, raw: splitAmount },
            validation,
        };
    }, [selectedLockForSplit, splitRatio, decimals]);

    // Calculate merge result
    const mergeResult = useMemo(() => {
        if (selectedLocksForMerge.length < 2) return null;

        const totalLocked = selectedLocksForMerge.reduce((s, l) => s + l.lockedAmount, 0);
        const totalVotingPower = selectedLocksForMerge.reduce((s, l) => s + l.votingPower, 0);

        // Target is the first selected lock - result takes its type
        const targetLock = selectedLocksForMerge[0];
        const isPerma = targetLock.isPerma;

        // For timed merges, use the latest unlock date among all locks being merged
        let latestUnlock = targetLock.unlockDate;
        if (!isPerma) {
            for (const lock of selectedLocksForMerge) {
                if (!lock.isPerma && lock.unlockDate > latestUnlock) {
                    latestUnlock = lock.unlockDate;
                }
            }
        }

        return {
            totalLocked,
            totalVotingPower,
            unlockDate: isPerma ? null : latestUnlock,
            isPerma,
        };
    }, [selectedLocksForMerge]);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    const handleLockSelect = (lockId: string) => {
        if (mode === 'split') {
            setSelectedLocks([lockId]);
        } else if (mode === 'merge') {
            setSelectedLocks(prev => {
                if (prev.includes(lockId)) {
                    // Deselect
                    return prev.filter(id => id !== lockId);
                } else if (prev.length < 2) {
                    // Select (max 2 for now)
                    return [...prev, lockId];
                }
                // Already have 2 selected, don't add more
                return prev;
            });
        }
        setError(null);
    };

    const handleModeSelect = (newMode: 'split' | 'merge') => {
        setMode(newMode);
        setSelectedLocks([]);
        setSplitRatio(50);
        setError(null);
        resetSplit();
        resetMerge();
    };

    const handleBack = () => {
        setMode('select');
        setSelectedLocks([]);
        setSplitRatio(50);
        setError(null);
        resetSplit();
        resetMerge();
    };

    const handleSplit = async () => {
        if (!selectedLockForSplit || !splitResult) return;
        if (!splitResult.validation.valid) {
            setError(splitResult.validation.error || 'Invalid split');
            return;
        }

        setError(null);
        try {
            await splitByRatio(
                selectedLockForSplit.tokenId,
                selectedLockForSplit.lockedAmountRaw,
                splitRatio
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Split failed');
        }
    };

    const handleMerge = async () => {
        if (selectedLocksForMerge.length < 2 || !mergeResult) return;
        if (!mergeValidation.valid) {
            setError(mergeValidation.error || 'Invalid merge');
            return;
        }

        setError(null);

        // Merge the second lock into the first (target)
        const targetId = selectedLocksForMerge[0].tokenId;
        const sourceId = selectedLocksForMerge[1].tokenId;

        try {
            // Note: For merging more than 2 locks, each merge requires a separate 
            // transaction confirmation. The UI currently supports merging 2 at a time.
            await merge(sourceId, targetId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Merge failed');
        }
    };

    const handleClose = () => {
        if (isPending) return;
        setMode('select');
        setSelectedLocks([]);
        setSplitRatio(50);
        setError(null);
        resetSplit();
        resetMerge();
        onClose();
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    const renderError = () => {
        const displayError = error || splitError?.message || mergeError?.message;
        if (!displayError) return null;

        return (
            <div className="split-merge__error">
                <WarningIcon />
                <span>{displayError}</span>
            </div>
        );
    };

    const renderModeSelect = () => (
        <>
            <div className="split-merge__options">
                <button
                    className="split-merge__option"
                    onClick={() => handleModeSelect('split')}
                    disabled={availableLocks.length === 0}
                >
                    <div className="split-merge__option-icon">
                        <SplitIcon />
                    </div>
                    <div className="split-merge__option-content">
                        <div className="split-merge__option-title">Split Position</div>
                        <div className="split-merge__option-desc">
                            Divide one {votingToken} lock into two separate positions with custom ratios
                        </div>
                    </div>
                    <div className="split-merge__option-arrow">
                        <ArrowIcon />
                    </div>
                </button>

                <button
                    className="split-merge__option"
                    onClick={() => handleModeSelect('merge')}
                    disabled={availableLocks.length < 2}
                >
                    <div className="split-merge__option-icon">
                        <MergeIcon />
                    </div>
                    <div className="split-merge__option-content">
                        <div className="split-merge__option-title">Merge Positions</div>
                        <div className="split-merge__option-desc">
                            Combine multiple {votingToken} locks into a single consolidated position
                        </div>
                    </div>
                    <div className="split-merge__option-arrow">
                        <ArrowIcon />
                    </div>
                </button>
            </div>

            {votedLocks.length > 0 && (
                <div className="split-merge__warning">
                    <WarningIcon />
                    <span>
                        {votedLocks.length} position{votedLocks.length > 1 ? 's' : ''} unavailable
                        (voted this epoch)
                    </span>
                </div>
            )}

            <div className="split-merge__info">
                <div className="split-merge__info-icon">💡</div>
                <div className="split-merge__info-text">
                    <strong>Pro tip:</strong> Split & Merge operations preserve your total {votingToken} voting power.
                    When merging, the resulting position uses the longest remaining lock duration.
                    <br /><br />
                    <strong>Note:</strong> Positions that have voted this epoch cannot be split or merged.
                </div>
            </div>
        </>
    );

    const renderLockList = () => (
        <div className="split-merge__locks">
            {availableLocks.map(lock => {
                const isSelected = selectedLocks.includes(lock.id);
                const timeRemaining = lock.isPerma ? 100 : (100 - lock.progress);
                const progressColor = lock.isPerma ? '#A78BFA' : lock.progress > 70 ? '#F59E0B' : '#22C55E';

                // For merge mode, check if this lock can be merged with already selected
                let isDisabled = false;
                let disabledReason = '';

                if (mode === 'merge' && selectedLocks.length > 0 && !isSelected) {
                    const firstSelected = availableLocks.find(l => l.id === selectedLocks[0]);
                    if (firstSelected) {
                        // If target (first selected) is timed, cannot add permanent locks
                        if (!firstSelected.isPerma && lock.isPerma) {
                            isDisabled = true;
                            disabledReason = 'Cannot merge permanent into timed. Select permanent as target first.';
                        }
                        // If target is permanent, any lock type is allowed (timed upgrades)
                    }
                }

                return (
                    <button
                        key={lock.id}
                        className={`split-merge__lock-item ${isSelected ? 'split-merge__lock-item--selected' : ''} ${isDisabled ? 'split-merge__lock-item--disabled' : ''}`}
                        onClick={() => !isDisabled && handleLockSelect(lock.id)}
                        disabled={isPending || isDisabled}
                        title={disabledReason}
                    >
                        <div className="split-merge__lock-checkbox">
                            {mode === 'merge' ? (
                                <div className={`split-merge__checkbox ${isSelected ? 'split-merge__checkbox--checked' : ''}`}>
                                    {isSelected && '✓'}
                                </div>
                            ) : (
                                <div className={`split-merge__radio ${isSelected ? 'split-merge__radio--checked' : ''}`}>
                                    {isSelected && <div className="split-merge__radio-dot" />}
                                </div>
                            )}
                        </div>

                        <div className="split-merge__lock-id">#{lock.id}</div>

                        <div className="split-merge__lock-amounts">
                            <div className="split-merge__lock-ignis">
                                {formatNumber(lock.lockedAmount)} {baseToken}
                            </div>
                            <div className="split-merge__lock-veignis">
                                {formatNumber(lock.votingPower)} {votingToken}
                            </div>
                        </div>

                        <div className="split-merge__lock-unlock">
                            {lock.isPerma ? (
                                <span className="split-merge__lock-perma">♾️ Perma</span>
                            ) : (
                                <span>{lock.unlockDate.toLocaleDateString()}</span>
                            )}
                        </div>

                        <div className="split-merge__lock-progress">
                            <div className="split-merge__lock-progress-bar">
                                <div
                                    className="split-merge__lock-progress-fill"
                                    style={{ width: `${timeRemaining}%`, background: progressColor }}
                                />
                            </div>
                            <span style={{ color: progressColor }}>{timeRemaining}%</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );

    const renderSplitMode = () => (
        <>
            <div className="split-merge__section-header">
                <button className="split-merge__back-btn" onClick={handleBack} disabled={isPending}>
                    <BackIcon /> Back
                </button>
                <h4>Select Position to Split</h4>
            </div>

            {renderLockList()}

            {selectedLockForSplit && splitResult && (
                <div className="split-merge__split-config">
                    <div className="split-merge__slider-header">
                        <span>Split Ratio</span>
                        <span className="split-merge__slider-value">
                            {100 - splitRatio}% / {splitRatio}%
                        </span>
                    </div>

                    <input
                        type="range"
                        min={10}
                        max={90}
                        value={splitRatio}
                        onChange={e => setSplitRatio(parseInt(e.target.value))}
                        disabled={isPending}
                        className="split-merge__slider"
                    />

                    <div className="split-merge__slider-labels">
                        <span>10%</span>
                        <span>50%</span>
                        <span>90%</span>
                    </div>

                    {!splitResult.validation.valid && (
                        <div className="split-merge__validation-error">
                            ⚠️ {splitResult.validation.error}
                        </div>
                    )}

                    <div className="split-merge__preview">
                        <div className="split-merge__preview-title">Preview Result</div>
                        <div className="split-merge__preview-cards">
                            <div className="split-merge__preview-card">
                                <div className="split-merge__preview-label">Keep (Position A)</div>
                                <div className="split-merge__preview-amount">
                                    {formatNumber(splitResult.lock1.amount)} {baseToken}
                                </div>
                                <div className="split-merge__preview-veignis">
                                    ~{formatNumber(splitResult.lock1.votingPower)} {votingToken}
                                </div>
                            </div>
                            <div className="split-merge__preview-divider">+</div>
                            <div className="split-merge__preview-card">
                                <div className="split-merge__preview-label">New (Position B)</div>
                                <div className="split-merge__preview-amount">
                                    {formatNumber(splitResult.lock2.amount)} {baseToken}
                                </div>
                                <div className="split-merge__preview-veignis">
                                    ~{formatNumber(splitResult.lock2.votingPower)} {votingToken}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {renderError()}

            <button
                className={`split-merge__submit-btn ${selectedLockForSplit && splitResult?.validation.valid && !isPending ? 'split-merge__submit-btn--active' : ''}`}
                onClick={handleSplit}
                disabled={!selectedLockForSplit || !splitResult?.validation.valid || isPending}
            >
                {isSplitPending
                    ? 'Confirm in Wallet...'
                    : isSplitConfirming
                        ? 'Splitting Position...'
                        : 'Split Position'}
            </button>
        </>
    );

    const renderMergeMode = () => (
        <>
            <div className="split-merge__section-header">
                <button className="split-merge__back-btn" onClick={handleBack} disabled={isPending}>
                    <BackIcon /> Back
                </button>
                <h4>Select Positions to Merge</h4>
            </div>

            <div className="split-merge__merge-hint">
                💡 Select 2 positions to merge. The <strong>first selected</strong> becomes the target.
                Timed locks can upgrade into permanent locks, but not vice versa.
            </div>

            {renderLockList()}

            {!mergeValidation.valid && selectedLocksForMerge.length >= 2 && (
                <div className="split-merge__validation-error">
                    ⚠️ {mergeValidation.error}
                </div>
            )}

            {mergeResult && mergeValidation.valid && (
                <div className="split-merge__merge-result">
                    <div className="split-merge__merge-result-title">Merged Position Preview</div>
                    <div className="split-merge__merge-result-row">
                        <span>Total Locked</span>
                        <span className="split-merge__merge-result-value">
                            {formatNumber(mergeResult.totalLocked)} {baseToken}
                        </span>
                    </div>
                    <div className="split-merge__merge-result-row">
                        <span>Total {votingToken}</span>
                        <span className="split-merge__merge-result-value split-merge__merge-result-value--purple">
                            {formatNumber(mergeResult.totalVotingPower)} {votingToken}
                        </span>
                    </div>
                    <div className="split-merge__merge-result-row">
                        <span>Unlock Date</span>
                        <span className="split-merge__merge-result-value">
                            {mergeResult.isPerma ? '♾️ Permanent' : mergeResult.unlockDate?.toLocaleDateString()}
                        </span>
                    </div>
                    <div className="split-merge__merge-result-note">
                        Position #{selectedLocksForMerge[0]?.id} will be kept.
                        {selectedLocksForMerge.length - 1} position{selectedLocksForMerge.length > 2 ? 's' : ''} will be burned.
                        {mergeResult.isPerma && selectedLocksForMerge.some(l => !l.isPerma) && (
                            <><br />⬆️ Timed positions will be upgraded to permanent.</>
                        )}
                    </div>
                </div>
            )}

            {renderError()}

            <button
                className={`split-merge__submit-btn ${selectedLocksForMerge.length >= 2 && mergeValidation.valid && !isPending ? 'split-merge__submit-btn--active' : ''}`}
                onClick={handleMerge}
                disabled={selectedLocksForMerge.length < 2 || !mergeValidation.valid || isPending}
            >
                {isMergePending
                    ? 'Confirm in Wallet...'
                    : isMergeConfirming
                        ? 'Merging Positions...'
                        : `Merge ${selectedLocksForMerge.length} Positions`}
            </button>
        </>
    );

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    if (!isOpen) return null;

    return (
        <div onClick={handleClose} className="modal-overlay modal-overlay--centered">
            <div onClick={e => e.stopPropagation()} className="modal split-merge__modal">
                <div className="modal__header">
                    <h3 className="modal__title">
                        {mode === 'select' && 'Split / Merge Positions'}
                        {mode === 'split' && 'Split Position'}
                        {mode === 'merge' && 'Merge Positions'}
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={isPending}
                        className="modal__close-btn split-merge__close-btn"
                        style={{ opacity: isPending ? 0.5 : 1 }}
                    >
                        ×
                    </button>
                </div>

                <div className="modal__body">
                    {mode === 'select' && renderModeSelect()}
                    {mode === 'split' && renderSplitMode()}
                    {mode === 'merge' && renderMergeMode()}
                </div>
            </div>
        </div>
    );
};

export default SplitMergeModal;
