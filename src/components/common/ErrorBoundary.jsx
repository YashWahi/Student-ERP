// src/components/common/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled Application Error:', error, errorInfo);

    // If dynamic import failed because a new release was deployed, auto-reload to fetch fresh assets
    const isChunkLoadError = error?.message?.includes('dynamically imported module') || error?.toString()?.includes('dynamically imported module') || error?.message?.includes('Failed to fetch');
    if (isChunkLoadError) {
      window.location.reload();
    }
  }

  handleReset = () => {
    window.sessionStorage.clear();
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#F8FAFC', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: 520, width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16,
            border: '1px solid #E2E8F0', padding: 36, textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', backgroundColor: '#FEF2F2',
              color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 24 }}>
              An unanticipated application error occurred. The system has safely trapped the exception.
            </p>

            {this.state.error && (
              <div style={{
                padding: 14, borderRadius: 8, backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                fontSize: '0.75rem', color: '#334155', fontFamily: 'monospace', textAlign: 'left',
                maxHeight: 120, overflowY: 'auto', marginBottom: 24
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  backgroundColor: '#2563EB', color: '#FFFFFF', borderRadius: 10,
                  border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
