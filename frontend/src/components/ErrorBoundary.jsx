import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626', marginBottom: '10px' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              An error occurred while rendering this page. You can try refreshing or resetting your session.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#f1f5f9',
                color: '#b91c1c',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '20px'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🚪 Reset Session & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

