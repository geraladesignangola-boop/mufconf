import { Component, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Fallback global para erros de renderização — evita ecrã branco
 * e oferece uma saída clara ao utilizador.
 */
export default class ErrorBoundary extends Component<Props, State> {
  // Sem @types/react no projeto, o tipo base é `any`; declaramos props
  // explicitamente para manter a verificação de tipos.
  declare readonly props: Readonly<Props>;

  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary] Erro não tratado:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[var(--wex-surface)] text-[var(--wex-ink)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-[var(--wex-surface-2)] border border-[var(--wex-line)]/12 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[#B95E26]" />
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-moderna-display)] text-2xl font-bold tracking-tight">
            Algo correu mal
          </h1>
          <p className="mt-3 text-sm text-[var(--wex-muted)] leading-relaxed">
            Ocorreu um erro inesperado ao apresentar esta página. Podes tentar
            novamente ou voltar ao início.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar novamente
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--wex-line)]/20 text-[var(--wex-ink)] text-xs font-semibold uppercase tracking-[0.12em] hover:border-[#B95E26] transition-colors"
            >
              <Home className="w-4 h-4" />
              Ir para o início
            </a>
          </div>
        </div>
      </div>
    );
  }
}
