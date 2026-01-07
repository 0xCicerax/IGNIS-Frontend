/**
 * Environment Error Display
 * 
 * Shows a user-friendly error message when the application
 * is misconfigured. This is shown in production when required
 * environment variables are missing.
 */

import React from 'react';

interface EnvErrorProps {
  title?: string;
  message?: string;
  showDetails?: boolean;
  details?: string[];
}

export const EnvError: React.FC<EnvErrorProps> = ({
  title = 'Configuration Error',
  message = 'The application is not properly configured. Please contact support.',
  showDetails = false,
  details = [],
}) => {
  const isDev = import.meta.env.DEV;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0c 0%, #141416 100%)',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.5rem',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#EF4444" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          color: '#EF4444',
        }}>
          {title}
        </h1>

        {/* Message */}
        <p style={{
          fontSize: '0.95rem',
          color: '#A3A3A3',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}>
          {message}
        </p>

        {/* Details (dev only) */}
        {isDev && showDetails && details.length > 0 && (
          <div style={{
            textAlign: 'left',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            marginBottom: '1.5rem',
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#8A8A8A',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Missing Configuration:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: '0.875rem',
              color: '#EF4444',
            }}>
              {details.map((detail, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  • {detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help text */}
        <p style={{
          fontSize: '0.8125rem',
          color: '#7A7A7A',
        }}>
          {isDev ? (
            <>Check your <code style={{ color: '#F5B041' }}>.env.local</code> file</>
          ) : (
            <>Error code: ENV_CONFIG_001</>
          )}
        </p>
      </div>
    </div>
  );
};

/**
 * Wrapper component that validates environment before rendering children
 */
export const EnvGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [envError, setEnvError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    // Check for critical environment variables
    const errors: string[] = [];
    
    // In production, WalletConnect is required
    if (import.meta.env.PROD && !import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
      errors.push('VITE_WALLETCONNECT_PROJECT_ID');
    }

    // Add more critical checks as needed
    // if (!import.meta.env.VITE_SUBGRAPH_URL_BASE) {
    //   errors.push('VITE_SUBGRAPH_URL_BASE');
    // }

    if (errors.length > 0 && import.meta.env.PROD) {
      setEnvError(errors);
    }
  }, []);

  if (envError) {
    return (
      <EnvError
        title="Configuration Required"
        message="Some required configuration is missing. The application cannot start."
        showDetails={true}
        details={envError}
      />
    );
  }

  return <>{children}</>;
};

export default EnvError;
