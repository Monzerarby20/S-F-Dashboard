import React from 'react';
import { Button } from './button';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Languages, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, language, toggleTheme, toggleLanguage } = useTheme();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </Button>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="h-9 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      >
        <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-1" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'ar' ? 'EN' : 'عر'}
        </span>
      </Button>
    </div>
  );
}

export function OneClickThemeSwitcher({ className }: { className?: string }) {
  const { theme, language, toggleTheme, toggleLanguage } = useTheme();

  const handleOneClick = () => {
    // Toggle both theme and language with one click
    toggleTheme();
    toggleLanguage();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOneClick}
      className={cn(
        'h-9 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border-gray-200 dark:border-gray-700',
        className
      )}
      title="Toggle theme and language"
    >
      <div className="flex items-center gap-2">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'ar' ? 'EN' : 'عر'}
        </span>
      </div>
    </Button>
  );
}