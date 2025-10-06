import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const useKeyboardNavigation = ({
  onEscape,
  onEnter,
  onTab,
  onArrowKeys,
}: UseKeyboardNavigationProps) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event);
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('right');
          }
          break;
      }
    },
    [onEscape, onEnter, onTab, onArrowKeys]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { handleKeyDown };
};

// Hook for managing focus trap within a container
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element when activated
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, isActive]);
};

// Hook for announcing changes to screen readers
export const useScreenReaderAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};