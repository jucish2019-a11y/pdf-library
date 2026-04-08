'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import type { Rendition } from 'epubjs';
import {
  X, Maximize2, Minimize2, Sun, Moon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EpubReaderProps {
  bookId: string;
  title?: string;
  onClose: () => void;
}

type Theme = 'dark' | 'light' | 'sepia';

const THEMES: Record<Theme, { body: Record<string, string> }> = {
  dark: { body: { background: '#0a0a0b', color: '#e5e5e5' } },
  light: { body: { background: '#ffffff', color: '#0a0a0b' } },
  sepia: { body: { background: '#f4ecd8', color: '#5b4636' } },
};

export function EpubReader({ bookId, title, onClose }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [hideUI, setHideUI] = useState(false);
  const renditionRef = useRef<Rendition | null>(null);

  // Load saved location from localStorage per book
  useEffect(() => {
    const saved = localStorage.getItem(`epub-loc-${bookId}`);
    if (saved) setLocation(saved);
  }, [bookId]);

  const onLocationChanged = useCallback((loc: string) => {
    setLocation(loc);
    localStorage.setItem(`epub-loc-${bookId}`, loc);
  }, [bookId]);

  const getRendition = useCallback((rendition: Rendition) => {
    renditionRef.current = rendition;
    Object.entries(THEMES).forEach(([name, styles]) => {
      rendition.themes.register(name, styles);
    });
    rendition.themes.select(theme);
    rendition.themes.fontSize('110%');
  }, [theme]);

  // Apply theme changes to live rendition
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme);
    }
  }, [theme]);

  // Auto-hide controls
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setHideUI(false);
      clearTimeout(timer);
      timer = setTimeout(() => setHideUI(true), 2500);
    };
    reset();
    window.addEventListener('mousemove', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') renditionRef.current?.next();
      if (e.key === 'ArrowLeft') renditionRef.current?.prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const cycleTheme = () => {
    setTheme(t => (t === 'dark' ? 'light' : t === 'light' ? 'sepia' : 'dark'));
  };

  const bgClass =
    theme === 'dark' ? 'bg-[#0a0a0b]' :
    theme === 'light' ? 'bg-white' :
    'bg-[#f4ecd8]';

  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col transition-colors duration-500', bgClass)}>
      {/* Top bar */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3',
          'bg-gradient-to-b from-black/80 via-black/50 to-transparent',
          'text-white transition-all duration-300',
          hideUI ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        )}
      >
        <p className="text-sm font-medium truncate pl-2 max-w-[50%]">
          {title ?? 'Reading'}
        </p>

        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-1 border border-white/10">
          <Button
            variant="ghost" size="icon"
            onClick={cycleTheme}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title={`Theme: ${theme}`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title="Fullscreen"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <Button
            variant="ghost" size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Side page controls */}
      <button
        onClick={() => renditionRef.current?.prev()}
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full',
          'bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm',
          'transition-opacity duration-300',
          hideUI ? 'opacity-0' : 'opacity-100'
        )}
        title="Previous page (←)"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => renditionRef.current?.next()}
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full',
          'bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm',
          'transition-opacity duration-300',
          hideUI ? 'opacity-0' : 'opacity-100'
        )}
        title="Next page (→)"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Reader */}
      <div className="flex-1 relative">
        <ReactReader
          url={`/api/files/${bookId}`}
          location={location}
          locationChanged={onLocationChanged}
          getRendition={getRendition}
          epubInitOptions={{ openAs: 'epub' }}
          showToc
        />
      </div>
    </div>
  );
}
