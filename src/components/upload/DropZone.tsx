'use client';

import { useState, useRef } from 'react';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

export function DropZone({ onFiles }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfs.length) onFiles(pdfs);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={e => handle(e.target.files)}
      />
      <CloudUpload className={cn('h-10 w-10 mx-auto mb-3', dragging ? 'text-primary' : 'text-muted-foreground')} />
      <p className="text-sm font-medium">Drop PDF files here or click to browse</p>
      <p className="text-xs text-muted-foreground mt-1">Supports multiple files</p>
    </div>
  );
}
