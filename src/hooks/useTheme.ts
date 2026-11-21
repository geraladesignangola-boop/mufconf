import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

/** Chave usada pelo script anti-flash do index.html e por este hook. */
const THEME_STORAGE_KEY = 'wex-theme';

/** Classe aplicada a <html> durante a transição de tema. */
const ANIMATION_CLASS = 'wex-theme-anim';

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

/** Tema atual do documento (já aplicado pelo script do index.html). */
function readAppliedTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Aplica o tema ao documento e (opcionalmente) guarda a escolha do utilizador.
 * `animate` ativa uma transição breve de cores para a troca não ser brusca.
 */
function applyTheme(theme: Theme, { persist = true, animate = false } = {}) {
  const root = document.documentElement;

  if (animate) {
    root.classList.add(ANIMATION_CLASS);
    window.setTimeout(() => root.classList.remove(ANIMATION_CLASS), 400);
  }

  root.classList.toggle('dark', theme === 'dark');

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // modo privado / sem armazenamento: o tema aplica-se só nesta sessão
    }
  }
}

/**
 * Estado do tema do site público.
 * A primeira visita segue a preferência do sistema; depois guarda a escolha.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readAppliedTheme());

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next, { persist: true, animate: true });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, { persist: true, animate: true });
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme, storedTheme: readStoredTheme };
}
