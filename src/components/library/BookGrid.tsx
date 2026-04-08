'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Book } from '@/types';
import { BookCard } from './BookCard';
import { BookOpen } from 'lucide-react';

interface BookGridProps {
  collectionId?: string;
  refreshKey?: number;
}

export function BookGrid({ collectionId, refreshKey }: BookGridProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (collectionId) params.set('collection', collectionId);
    fetch(`/api/books?${params}`)
      .then(r => r.json())
      .then(data => { setBooks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collectionId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks, refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <BookOpen className="h-12 w-12 text-primary/60" strokeWidth={1.2} />
          </div>
        </div>
        <h3 className="text-xl font-semibold mt-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Your library awaits
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
          Upload your first PDF to begin building your personal book collection
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {books.map((book, i) => (
        <BookCard key={book.id} book={book} index={i} />
      ))}
    </div>
  );
}
