'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Book } from '@/types';
import { BookCard } from './BookCard';
import { Library } from 'lucide-react';

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Library className="h-14 w-14 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">No books yet</h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Upload your first PDF to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
