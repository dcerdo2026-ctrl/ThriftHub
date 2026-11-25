import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        readable = `Database access error (${parsed.operationType || 'operation'}): ${parsed.error}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ThriftHub ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#261C15] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2D7C6] rounded-xl p-8 text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#F2ECE1] flex items-center justify-center text-[#9E3F2B]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold text-[#261C15]">
                Something went off the rack
              </h1>
              <p className="text-sm text-[#5C4A3D] leading-relaxed">
                {this.state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg hover:bg-[#4E311D] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload ThriftHub
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
