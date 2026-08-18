import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[UI error]', error.message, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: '#0e0c0a',
            color: '#ece6d9',
          }}
        >
          <section style={{ maxWidth: 420, textAlign: 'center' }}>
            <p>예기치 못한 오류가 발생했습니다.</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              style={{
                minHeight: 40,
                padding: '0 16px',
                border: '1px solid #c4a574',
                background: 'transparent',
                color: '#c4a574',
                font: 'inherit',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
          </section>
        </div>
      );
    }
    return this.props.children;
  }
}
