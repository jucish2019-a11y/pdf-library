'use client';

import { useEffect, useRef } from 'react';
import { pdfjs } from 'react-pdf';

// Set the worker source
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface CoverExtractorProps {
  bookId: string;
  fileUrl: string;
  onDone?: () => void;
}

export function CoverExtractor({ bookId, fileUrl, onDone }: CoverExtractorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    (async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Render at 2x scale for higher-res cover
        const scale = Math.min(400 / viewport.width, 600 / viewport.height, 2);
        const scaled = page.getViewport({ scale });
        canvas.width = scaled.width;
        canvas.height = scaled.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;

        canvas.toBlob(async blob => {
          if (!blob) return;
          const form = new FormData();
          form.append('bookId', bookId);
          form.append('image', blob, `${bookId}.png`);
          await fetch('/api/covers', { method: 'POST', body: form });
          onDone?.();
        }, 'image/png');
      } catch (err) {
        console.warn('Cover extraction failed:', err);
        onDone?.();
      }
    })();
  }, [bookId, fileUrl, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' }}
    />
  );
}
