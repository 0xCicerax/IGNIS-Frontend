import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { WalletProvider } from './contexts';
import { initSentry, SentryErrorBoundary } from './lib/sentry';
import { registerServiceWorker } from './utils/serviceWorker';
import App from './App';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Initialize Sentry error tracking before rendering
initSentry();

// Register service worker for offline support (production only)
registerServiceWorker();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Fallback UI for unhandled errors
const ErrorFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#0a0a0f',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    padding: '2rem',
    textAlign: 'center',
  }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
    <p style={{ color: '#888', marginBottom: '2rem' }}>
      We've been notified and are working on a fix.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        padding: '12px 24px',
        fontSize: '1rem',
        cursor: 'pointer',
      }}
    >
      Reload Page
    </button>
  </div>
);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <WalletProvider>
          <App />
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </WalletProvider>
      </BrowserRouter>
    </SentryErrorBoundary>
  </React.StrictMode>
);
