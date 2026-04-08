'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/types';
import { StatusBadge } from './StatusBadge';
import { BookOpen, FileText } from 'lucide-react';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const coverUrl = book.cover_path ? `/api/cover-image/${book.id}` : null;
  const progress = book.page_count > 0
    ? Math.round((book.current_page / book.page_count) * 100)
    : 0;

  return (
    <Link href={`/books/${book.id}`} className="group block">
      <div className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5">
        {/* Cover */}
        <div className="relative aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
          {book.cover_path ? (
            <img
              src={`/api/cover-image/${book.id}`}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <FileText className="h-12 w-12" />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="flex items-center gap-1.5 text-white text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Open
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <p className="font-medium text-sm leading-tight line-clamp-2">{book.title}</p>
          {book.author && (
            <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={book.status} />
            {book.page_count > 0 && (
              <span className="text-xs text-muted-foreground">{book.page_count}p</span>
            )}
          </div>
          {book.status === 'reading' && book.page_count > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
