/**
 * Sentry Error Tracking Integration
 * Simplified version for demo/development
 */

import * as Sentry from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  enabled: boolean;
  tracesSampleRate: number;
}

function getConfig(): SentryConfig {
  const isProd = import.meta.env.PROD;
  const dsn = import.meta.env.VITE_SENTRY_DSN || '';
  
  return {
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (isProd ? 'production' : 'development'),
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    enabled: Boolean(dsn) && isProd,
    tracesSampleRate: isProd ? 0.1 : 1.0,
  };
}

let isInitialized = false;

export function initSentry(): void {
  if (isInitialized) return;
  
  const config = getConfig();
  
  if (!config.enabled) {
    console.log('[Sentry] Disabled - no DSN configured or not in production');
    return;
  }
  
  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: config.tracesSampleRate,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    
    isInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (error: unknown) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  if (!isInitialized) {
    console.error('[Error]', error, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!isInitialized) {
    console.log(`[${level}]`, message);
    return;
  }
  
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; address?: string } | null): void {
  if (!isInitialized) return;
  Sentry.setUser(user);
}

export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  if (!isInitialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Wrap component with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return Sentry.withErrorBoundary(Component, { fallback });
}

export default {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  SentryErrorBoundary,
  withErrorBoundary,
};
