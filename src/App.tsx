import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages públicas (bundle inicial)
import ConvitePage from './pages/ConvitePage';
import TermosPage from './pages/TermosPage';
import ModernaPage from './pages/ModernaPage';

// Páginas pesadas/carregadas sob demanda (code splitting)
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));

// Feedback global: toasts + fronteira de erro
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { usePageMeta } from './hooks/usePageMeta';
import { Skeleton } from './components/ui/Skeleton';

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[var(--wex-surface)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function NotFoundPage() {
  usePageMeta({
    title: 'Página não encontrada — Mulheres de Fogo',
    description: 'O endereço pedido não existe.',
    path: '/404',
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-[var(--wex-surface)] text-[var(--wex-ink)] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-[family-name:var(--font-caverna-mono)] text-xs uppercase tracking-[0.25em] text-[#B95E26]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-extrabold font-[family-name:var(--font-moderna-display)] text-[var(--wex-ink)]">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm text-[var(--wex-muted)] leading-relaxed">
          O endereço pedido não existe. Volta à página principal para continuar.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] font-semibold text-xs uppercase tracking-widest transition-colors"
        >
          Ir para o início
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<ModernaPage />} />
              <Route path="/moderna" element={<Navigate to="/" replace />} />
              <Route path="/caverna" element={<Navigate to="/" replace />} />
              <Route path="/classico" element={<Navigate to="/" replace />} />
              <Route path="/convite" element={<ConvitePage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/checkin" element={<CheckInPage />} />
              <Route path="/termos" element={<TermosPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
