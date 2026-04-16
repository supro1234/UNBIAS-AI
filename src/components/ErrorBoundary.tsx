import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--void)', color: 'var(--text-1)' }} role="alert">
          <div style={{ background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 400, textAlign: 'center' }}>
            <AlertTriangle size={48} color="#dc3545" style={{ marginBottom: 16 }} />
            <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>Something went wrong.</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
              The application encountered an unexpected error.
            </p>
            <button
              onClick={this.handleReload}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #4285F4, #6D28D9)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              aria-label="Reload application"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
