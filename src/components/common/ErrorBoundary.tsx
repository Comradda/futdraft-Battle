import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  onBackToLobby?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#12080a] via-[#0a0708] to-[#050405] text-white select-none">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>

            <h3 className="text-base font-black tracking-wide text-amber-300 uppercase mb-1">
              {this.props.fallbackTitle || 'Mesa Temporalmente No Disponible'}
            </h3>

            <p className="text-xs text-neutral-300 mb-5 leading-relaxed">
              Ocurrió una sincronización inesperada en la mesa. Las fichas y saldos permanecen seguros.
            </p>

            <div className="w-full space-y-2.5">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-neutral-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Mesa
              </button>

              {this.props.onBackToLobby && (
                <button
                  onClick={this.props.onBackToLobby}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Salón Principal
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
