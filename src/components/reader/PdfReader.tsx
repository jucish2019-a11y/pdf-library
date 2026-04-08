'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X, RotateCw, RotateCcw, Maximize2, Minimize2, Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfReaderProps {
  bookId: string;
  title?: string;
  onClose: () => void;
}

type Rotation = 0 | 90 | 180 | 270;

export function PdfReader({ bookId, title, onClose }: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [hideUI, setHideUI] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-hide controls after 2s of mouse inactivity
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

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'r') rotate('cw');
      if (e.key === 'R') rotate('ccw');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = (dir: 'cw' | 'ccw') => {
    setRotation(r => {
      const next = dir === 'cw' ? r + 90 : r - 90;
      return (((next % 360) + 360) % 360) as Rotation;
    });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const isSideways = rotation === 90 || rotation === 270;
  const iframeW = isSideways ? dims.h : dims.w;
  const iframeH = isSideways ? dims.w : dims.h;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col transition-colors duration-500',
        lightMode ? 'bg-stone-200' : 'bg-zinc-950'
      )}
    >
      {/* Top bar — floats and auto-hides */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3',
          'bg-gradient-to-b from-black/90 via-black/60 to-transparent',
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
            onClick={() => rotate('ccw')}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title="Rotate left (R)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={() => rotate('cw')}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title="Rotate right (r)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <Button
            variant="ghost" size="icon"
            onClick={() => setLightMode(v => !v)}
            className="text-white hover:bg-white/15 h-8 w-8 rounded-full"
            title="Toggle background"
          >
            {lightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
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

      {/* Rotation indicator */}
      {rotation !== 0 && (
        <div
          className={cn(
            'absolute bottom-6 left-1/2 -translate-x-1/2 z-20',
            'bg-black/70 backdrop-blur-md text-white text-xs font-medium',
            'px-3 py-1.5 rounded-full border border-white/10',
            'transition-opacity duration-300',
            hideUI ? 'opacity-0' : 'opacity-100'
          )}
        >
          {rotation}°
        </div>
      )}

      {/* PDF container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {dims.w > 0 && (
          <iframe
            src={`/api/files/${bookId}#toolbar=1&navpanes=0&view=FitH`}
            title="PDF Viewer"
            className="absolute border-0 bg-white shadow-2xl transition-transform duration-500 ease-out"
            style={{
              width: iframeW,
              height: iframeH,
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          />
        )}
      </div>
    </div>
  );
}
