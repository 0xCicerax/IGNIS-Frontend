import { logger } from '../utils/logger';
import React, { Component, ReactNode, useState } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
    title?: string;
    message?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        logger.error('Error caught by boundary', error, { errorInfo });
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error!, this.handleReset);
            }

            return (
                <div className="error-boundary" role="alert" aria-live="assertive">
                    <div className="error-boundary__icon" aria-hidden="true">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h2 className="error-boundary__title">
                        {this.props.title || 'Something went wrong'}
                    </h2>
                    <p className="error-boundary__message">
                        {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="error-boundary__button"
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="error-boundary__details">
                            <summary className="error-boundary__summary">
                                Error Details (Development Only)
                            </summary>
                            <pre className="error-boundary__stack">
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

interface PageErrorBoundaryProps {
    children: ReactNode;
    pageName?: string;
}

interface PageErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
    constructor(props: PageErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        logger.error(`Error in ${this.props.pageName || 'page'}`, error, { errorInfo });
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="page-error-wrapper">
                    <div className="error-boundary" role="alert" aria-live="assertive">
                        <div className="error-boundary__icon" aria-hidden="true">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <h2 className="error-boundary__title">
                            Failed to load {this.props.pageName || 'page'}
                        </h2>
                        <p className="error-boundary__message">
                            There was a problem loading this page. You can try again or go back.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={this.handleRetry} className="error-boundary__button">
                                Try Again
                            </button>
                            <button 
                                onClick={() => window.history.back()} 
                                className="error-boundary__button"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#A3A3A3' }}
                            >
                                Go Back
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-boundary__details">
                                <summary className="error-boundary__summary">
                                    Error Details
                                </summary>
                                <pre className="error-boundary__stack">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

interface UseErrorHandlerResult {
    error: Error | null;
    resetError: () => void;
    handleError: (err: Error) => void;
}

export function useErrorHandler(): UseErrorHandlerResult {
    const [error, setError] = useState<Error | null>(null);
    
    const resetError = (): void => setError(null);
    
    const handleError = (err: Error): void => {
        logger.error('Error handled', err);
        setError(err);
    };

    if (error) {
        throw error;
    }

    return { error, resetError, handleError };
}

export default ErrorBoundary;
