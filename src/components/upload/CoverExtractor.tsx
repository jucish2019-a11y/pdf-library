'use client';

import { useEffect, useRef } from 'react';

interface CoverExtractorProps {
  bookId: string;
  fileUrl: string;
  onDone?: () => void;
}

export function CoverExtractor({ bookId, fileUrl, onDone }: CoverExtractorProps) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    (async () => {
      try {
        // Fully dynamic import — only runs in the browser, never during SSR
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(400 / viewport.width, 600 / viewport.height, 2);
        const scaled = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport: scaled, canvas }).promise;

        canvas.toBlob(async blob => {
          if (!blob) { onDone?.(); return; }
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

  return null;
}
