'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import type { Rendition, NavItem } from 'epubjs';
import {
  X, Maximize2, Minimize2, Sun, Moon, ChevronLeft, ChevronRight,
  Type, Minus, Plus, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EpubReaderProps {
  bookId: string;
  title?: string;
  onClose: () => void;
}

type Theme = 'dark' | 'light' | 'sepia';
type FontFamily = 'serif' | 'sans' | 'default';

const THEMES: Record<Theme, { body: Record<string, string> }> = {
  dark: { body: { background: '#0a0a0b', color: '#e5e5e5' } },
  light: { body: { background: '#ffffff', color: '#0a0a0b' } },
  sepia: { body: { background: '#f4ecd8', color: '#5b4636' } },
};

const FONT_STACKS: Record<FontFamily, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '-apple-system, system-ui, "Segoe UI", sans-serif',
  default: 'inherit',
};

const SETTINGS_KEY = 'epub-settings';

function findChapterLabel(toc: NavItem[], href: string): string | null {
  const cleanHref = href.split('#')[0];
  for (const item of toc) {
    const itemHref = (item.href || '').split('#')[0];
    if (itemHref && (itemHref === cleanHref || cleanHref.endsWith(itemHref) || itemHref.endsWith(cleanHref))) {
      return (item.label || '').trim();
    }
    if (item.subitems?.length) {
      const sub = findChapterLabel(item.subitems, href);
      if (sub) return sub;
    }
  }
  return null;
}

export function EpubReader({ bookId, title, onClose }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [fontSize, setFontSize] = useState(110);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [hideUI, setHideUI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState('');
  const renditionRef = useRef<Rendition | null>(null);
  const tocRef = useRef<NavItem[]>([]);

  // Load persisted settings + reading location
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        if (typeof s.fontSize === 'number') setFontSize(s.fontSize);
        if (s.fontFamily) setFontFamily(s.fontFamily);
        if (s.theme) setTheme(s.theme);
      }
    } catch {}
    const savedLoc = localStorage.getItem(`epub-loc-${bookId}`);
    if (savedLoc) setLocation(savedLoc);
  }, [bookId]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fontSize, fontFamily, theme }));
  }, [fontSize, fontFamily, theme]);

  const onLocationChanged = useCallback((loc: string) => {
    setLocation(loc);
    localStorage.setItem(`epub-loc-${bookId}`, loc);

    const r = renditionRef.current;
    if (!r) return;
    // epubjs types are loose here
    const current = r.currentLocation() as unknown as {
      start?: { percentage?: number; href?: string };
    };
    if (typeof current?.start?.percentage === 'number') {
      setProgress(current.start.percentage);
    }
    const href = current?.start?.href;
    if (href && tocRef.current.length) {
      const label = findChapterLabel(tocRef.current, href);
      if (label) setChapter(label);
    }
  }, [bookId]);

  const onTocChanged = useCallback((toc: NavItem[]) => {
    tocRef.current = toc;
  }, []);

  const getRendition = useCallback((rendition: Rendition) => {
    renditionRef.current = rendition;
    Object.entries(THEMES).forEach(([name, styles]) => {
      rendition.themes.register(name, styles);
    });
    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}%`);
    rendition.themes.override('font-family', FONT_STACKS[fontFamily], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme changes to live rendition
  useEffect(() => {
    renditionRef.current?.themes.select(theme);
  }, [theme]);

  // Apply font size changes
  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  // Apply font family changes
  useEffect(() => {
    renditionRef.current?.themes.override('font-family', FONT_STACKS[fontFamily], true);
  }, [fontFamily]);

  // Auto-hide controls
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setHideUI(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!showSettings) setHideUI(true);
      }, 2800);
    };
    reset();
    window.addEventListener('mousemove', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', reset);
    };
  }, [showSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else onClose();
      }
      if (e.key === 'ArrowRight' || e.key === ' ') renditionRef.current?.next();
      if (e.key === 'ArrowLeft') renditionRef.current?.prev();
      if (e.key === '+' || e.key === '=') setFontSize(s => Math.min(200, s + 10));
      if (e.key === '-' || e.key === '_') setFontSize(s => Math.max(80, s - 10));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showSettings]);

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

  const progressPct = Math.round(progress * 100);

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
        <div className="min-w-0 flex-1 pl-2 pr-4">
          <p className="text-sm font-medium truncate">{title ?? 'Reading'}</p>
          {chapter && (
            <p className="text-[11px] text-white/60 truncate mt-0.5">{chapter}</p>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-1.5 py-1 border border-white/10">
          <Button
            variant="ghost" size="icon"
            onClick={() => setShowSettings(v => !v)}
            className={cn(
              'text-white hover:bg-white/15 h-8 w-8 rounded-full',
              showSettings && 'bg-white/20'
            )}
            title="Reading settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
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

      {/* Settings popover */}
      {showSettings && (
        <div
          className={cn(
            'absolute top-16 right-4 z-30 w-72 p-5 rounded-2xl',
            'bg-black/85 backdrop-blur-xl border border-white/10 text-white shadow-2xl',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
        >
          <div className="mb-5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Font Size</label>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setFontSize(s => Math.max(80, s - 10))}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Decrease (-)"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-sm font-semibold tabular-nums">{fontSize}%</div>
                <div className="h-1 mt-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all"
                    style={{ width: `${((fontSize - 80) / 120) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setFontSize(s => Math.min(200, s + 10))}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Increase (+)"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/60">Typeface</label>
            <div className="flex gap-1.5 mt-2">
              {(['serif', 'sans', 'default'] as FontFamily[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                    fontFamily === f
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                  style={{ fontFamily: FONT_STACKS[f] }}
                >
                  {f === 'default' ? 'Book' : f === 'serif' ? 'Serif' : 'Sans'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="text-[10px] text-white/40 space-y-1">
              <div className="flex justify-between"><span>Next page</span><kbd className="font-mono">→ / Space</kbd></div>
              <div className="flex justify-between"><span>Previous page</span><kbd className="font-mono">←</kbd></div>
              <div className="flex justify-between"><span>Font size</span><kbd className="font-mono">+ / −</kbd></div>
              <div className="flex justify-between"><span>Close</span><kbd className="font-mono">Esc</kbd></div>
            </div>
          </div>
        </div>
      )}

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

      {/* Bottom progress bar */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 px-6 pb-4 pt-6',
          'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
          'transition-all duration-300',
          hideUI ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
        )}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-[11px] text-white/70 mb-1.5 font-medium tabular-nums">
            <span className="flex items-center gap-1.5">
              <Type className="h-3 w-3" />
              {fontSize}%
            </span>
            <span>{progressPct}% read</span>
          </div>
          <div className="h-1 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reader */}
      <div className="flex-1 relative">
        <ReactReader
          url={`/api/files/${bookId}`}
          location={location}
          locationChanged={onLocationChanged}
          tocChanged={onTocChanged}
          getRendition={getRendition}
          epubInitOptions={{ openAs: 'epub' }}
          showToc
        />
      </div>
    </div>
  );
}
