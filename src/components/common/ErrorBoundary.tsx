import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Planr ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen min-h-[100dvh] bg-surface flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-surface-lowest border border-outline-variant rounded-lg p-8 max-w-md w-full shadow-modal space-y-4">
            <div className="w-12 h-12 rounded-md bg-surface-low text-primary flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <h1 className="font-serif text-2xl font-semibold text-on-surface">
              A Moment of Stillness
            </h1>

            <p className="text-xs text-secondary leading-relaxed">
              An unexpected error occurred. Your work and tasks remain completely safe.
            </p>

            {this.state.error && (
              <pre className="text-[11px] bg-surface-low p-3 rounded text-left overflow-x-auto text-secondary font-mono">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container hover:bg-primary rounded-md text-xs font-medium shadow-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
