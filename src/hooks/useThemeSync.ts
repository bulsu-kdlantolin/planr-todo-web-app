import { useEffect } from 'react';
import { useMetaStore } from '../store/useMetaStore';

/**
 * Hook to synchronize theme tokens and dark mode classes on the document root element.
 */
export function useThemeSync() {
  const theme = useMetaStore((state) => state.settings.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  return { theme };
}
