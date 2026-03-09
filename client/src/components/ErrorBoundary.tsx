import { Component, ReactNode } from 'react';
import { captureError } from '@/lib/errorTracking';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      component: 'ErrorBoundary',
      action: 'component_crash',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-serif font-bold text-navy mb-2">Something went wrong</h1>
            <p className="text-slate mb-4 font-body">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold-light"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function setupGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      component: 'GlobalErrorHandler',
      action: 'uncaught_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    captureError(error, {
      component: 'GlobalErrorHandler',
      action: 'unhandled_promise_rejection',
    });
  });
}
