import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

type ThemeContextValue = {
  /** The active theme. */
  mode: ThemeMode;
  /** The actually-applied theme (alias of mode; kept for consumers). */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** Toggle light <-> dark. */
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStored());

  // Seed `resolved` from whatever the inline head script already applied, so the
  // first paint stays consistent with the no-flash script in index.html.
  const [resolved, setResolved] = useState<ResolvedTheme>(() => {
    const attr = document.documentElement.dataset.theme;
    return attr === 'dark' ? 'dark' : 'light';
  });

  // Apply the chosen mode whenever it changes.
  useEffect(() => {
    applyTheme(mode);
    setResolved(mode);
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  };

  const toggle = () => setMode(mode === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
