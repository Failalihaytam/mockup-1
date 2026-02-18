// Theme context for dark/light mode toggle

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as UI5ThemeProvider } from '@ui5/webcomponents-react';
import { setTheme as setUI5Theme } from '@ui5/webcomponents-base/dist/config/Theme.js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const UI5_LIGHT = 'sap_horizon';
const UI5_DARK = 'sap_horizon_dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    // Sync UI5 Web Components theme
    void setUI5Theme(theme === 'dark' ? UI5_DARK : UI5_LIGHT);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <UI5ThemeProvider>
        {children}
      </UI5ThemeProvider>
    </ThemeContext.Provider>
  );
};
