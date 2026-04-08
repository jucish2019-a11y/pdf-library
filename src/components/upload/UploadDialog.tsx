'use client';

import { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { DropZone } from './DropZone';

const CoverExtractor = dynamic(
  () => import('./CoverExtractor').then(m => ({ default: m.CoverExtractor })),
  { ssr: false }
);
import { toast } from 'sonner';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface UploadItem {
  file: File;
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'error';
  bookId?: string;
}

interface UploadDialogProps {
  children: ReactNode;
  onUploaded?: () => void;
}

export function UploadDialog({ children, onUploaded }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  const updateItem = (file: File, patch: Partial<UploadItem>) =>
    setItems(prev => prev.map(i => i.file === file ? { ...i, ...patch } : i));

  const uploadFile = async (file: File) => {
    updateItem(file, { status: 'uploading' });
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/books', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const book = await res.json();
      updateItem(file, { status: 'extracting', bookId: book.id });
    } catch {
      updateItem(file, { status: 'error' });
      toast.error(`Failed to upload "${file.name}"`);
    }
  };

  const handleFiles = async (files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({ file, status: 'pending' }));
    setItems(prev => [...prev, ...newItems]);
    await Promise.all(files.map(uploadFile));
  };

  const handleCoverDone = (file: File) => {
    updateItem(file, { status: 'done' });
    toast.success(`"${file.name}" added to library`);
    onUploaded?.();
  };

  const allDone = items.length > 0 && items.every(i => i.status === 'done' || i.status === 'error');

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setItems([]); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Books</DialogTitle>
        </DialogHeader>
        <DropZone onFiles={handleFiles} />
        {items.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                {item.status === 'error' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                {(item.status === 'uploading' || item.status === 'extracting' || item.status === 'pending') && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.status === 'extracting' ? 'Generating cover...' : item.status}
                  </p>
                </div>
                {/* Hidden cover extractor */}
                {item.status === 'extracting' && item.bookId && (
                  <CoverExtractor
                    key={item.bookId}
                    bookId={item.bookId}
                    fileUrl={`/api/files/${item.bookId}`}
                    onDone={() => handleCoverDone(item.file)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {allDone && (
          <p className="text-sm text-center text-muted-foreground">
            All done! You can close this window.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
