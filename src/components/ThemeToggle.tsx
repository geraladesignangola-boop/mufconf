import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  /** Renderiza como botão flutuante (páginas sem barra de navegação). */
  floating?: boolean;
  className?: string;
}

/**
 * Seletor claro/escuro do site público.
 * - `floating`: botão fixo ao canto superior direito (Termos, Convite, 404…)
 * - caso contrário: botão inline, para colocar dentro de uma barra de topo.
 */
export default function ThemeToggle({ floating = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const variant = floating
    ? 'fixed top-4 right-4 z-50 p-2.5 rounded-full bg-[var(--wex-card)] border border-[var(--wex-line)]/15 text-[var(--wex-ink)] shadow-lg hover:border-[var(--wex-line)]/40 hover:text-[var(--wex-accent-ink)]'
    : 'p-2 rounded-full border border-transparent text-[var(--wex-muted)] hover:text-[var(--wex-ink)] hover:bg-[var(--wex-surface-2)] hover:border-[var(--wex-line)]/15';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para o modo claro' : 'Mudar para o modo escuro'}
      aria-pressed={isDark}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer ${variant} ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
