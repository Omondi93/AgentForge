import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'system' | 'dark' | 'light';
export type DashboardDensity = 'comfortable' | 'compact';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  density: DashboardDensity;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDensity: (density: DashboardDensity) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('agentforge_theme_mode');
    if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    const legacy = localStorage.getItem('agentforge_theme');
    if (legacy === 'light' || legacy === 'dark') return legacy;
    return 'dark'; // Default to dark for IDE aesthetic
  });

  const [density, setDensityState] = useState<DashboardDensity>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    const saved = localStorage.getItem('agentforge_density');
    if (saved === 'comfortable' || saved === 'compact') return saved;
    return 'comfortable';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const theme: Theme = themeMode === 'system' ? (systemIsDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('agentforge_theme_mode', themeMode);
    localStorage.setItem('agentforge_theme', theme);
  }, [theme, themeMode]);

  useEffect(() => {
    localStorage.setItem('agentforge_density', density);
  }, [density]);

  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      return next;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeModeState(newTheme);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setThemeModeState(newMode);
  };

  const setDensity = (newDensity: DashboardDensity) => {
    setDensityState(newDensity);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        density,
        toggleTheme,
        setTheme,
        setThemeMode,
        setDensity,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
