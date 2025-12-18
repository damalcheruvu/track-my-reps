import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            {this.props.showDetails && this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-btn">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="reload-btn">
                Reload Page
              </button>
            </div>
          </div>
          <style>{`
            .error-boundary {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .error-content {
              background: white;
              border-radius: 16px;
              padding: 3rem 2rem;
              max-width: 500px;
              text-align: center;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .error-content h2 {
              color: #1f2937;
              margin-bottom: 0.5rem;
            }
            .error-content p {
              color: #6b7280;
              margin-bottom: 1.5rem;
            }
            .error-details {
              text-align: left;
              background: #f9fafb;
              padding: 1rem;
              border-radius: 8px;
              margin-bottom: 1.5rem;
            }
            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #374151;
            }
            .error-details pre {
              font-size: 0.75rem;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
              margin-top: 0.5rem;
              color: #dc2626;
            }
            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
            }
            .retry-btn, .reload-btn {
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .retry-btn {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
            }
            .retry-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .reload-btn {
              background: #f3f4f6;
              color: #374151;
              border: 2px solid #e5e7eb;
            }
            .reload-btn:hover {
              background: #e5e7eb;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
