import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import clsx from 'clsx';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-white  p-1 rounded-xl border border-gray-200 ">
      <button
        onClick={() => setTheme('light')}
        className={clsx(
          "p-2 rounded-lg transition-all",
          theme === 'light' 
            ? "bg-white  text-amber-500 shadow-sm" 
            : "text-gray-400 hover:text-gray-600 :text-zinc-300"
        )}
        title="Modo Claro"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={clsx(
          "p-2 rounded-lg transition-all",
          theme === 'dark' 
            ? "bg-white  text-indigo-500 shadow-sm" 
            : "text-gray-400 hover:text-gray-600 :text-zinc-300"
        )}
        title="Modo Oscuro"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={clsx(
          "p-2 rounded-lg transition-all",
          theme === 'system' 
            ? "bg-white  text-primary-500 shadow-sm" 
            : "text-gray-400 hover:text-gray-600 :text-zinc-300"
        )}
        title="Sistema"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
