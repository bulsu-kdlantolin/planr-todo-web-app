import React, { Component, ErrorInfo, ReactNode } from 'react';
import { exportWorkspaceAsJSON } from '../../utils/exportEngines';
import { RotateCcw, Download, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Planr Global ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleExportBackup = () => {
    try {
      exportWorkspaceAsJSON();
    } catch (err) {
      console.error('Failed to export backup from ErrorBoundary:', err);
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[100dvh] bg-surface flex items-center justify-center p-6 text-on-surface select-none"
        >
          <div className="w-full max-w-lg bg-surface-lowest border border-outline-variant rounded-2xl p-8 shadow-card space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-on-surface">
                  Something went quiet
                </h1>
                <p className="text-xs text-secondary mt-0.5 font-sans">
                  An unexpected issue occurred while rendering. Your tasks and settings are safe.
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-low rounded-xl border border-outline-subtle space-y-2">
              <p className="text-xs text-on-surface leading-relaxed font-sans">
                You can reload the application to restore your workspace, or download a quick JSON backup right now before refreshing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container text-xs font-semibold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleExportBackup}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-low hover:bg-surface-high border border-outline-variant text-xs font-semibold text-on-surface transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-tertiary" aria-hidden="true" />
                <span>Download Backup (JSON)</span>
              </button>
            </div>

            {/* Collapsible Error Trace Details */}
            {this.state.error && (
              <div className="pt-3 border-t border-outline-subtle">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="text-[11px] text-secondary hover:text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{this.state.showDetails ? 'Hide technical details' : 'View technical details'}</span>
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2.5 p-3 rounded-lg bg-surface-low border border-outline-subtle text-[10px] font-mono text-secondary overflow-x-auto max-h-40 leading-normal select-text">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
