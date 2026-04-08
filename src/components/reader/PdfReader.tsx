'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfReaderProps {
  bookId: string;
  initialPage?: number;
  onClose: () => void;
  onPageChange?: (page: number) => void;
}

export function PdfReader({ bookId, initialPage = 1, onClose, onPageChange }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.2);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goTo = (page: number) => {
    const p = Math.min(Math.max(1, page), numPages);
    setPageNumber(p);
    onPageChange?.(p);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 text-white">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => goTo(pageNumber - 1)} disabled={pageNumber <= 1} className="text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm min-w-[100px] text-center">
            {pageNumber} / {numPages || '…'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => goTo(pageNumber + 1)} disabled={pageNumber >= numPages} className="text-white hover:bg-white/10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="text-white hover:bg-white/10">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(3, s + 0.2))} className="text-white hover:bg-white/10">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 ml-2">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* PDF */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-4">
        <Document
          file={`/api/files/${bookId}`}
          onLoadSuccess={onLoadSuccess}
          loading={<div className="text-white/50 mt-20">Loading PDF…</div>}
          error={<div className="text-red-400 mt-20">Failed to load PDF</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  );
}
