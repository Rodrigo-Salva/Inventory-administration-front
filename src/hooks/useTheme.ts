import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }, []);

  return { theme: 'light' as Theme, setTheme: (_: Theme) => {} };
};
