'use client';

import Link from 'next/link';
import type { Book } from '@/types';
import { StatusBadge } from './StatusBadge';
import { BookOpen, FileText } from 'lucide-react';

interface BookCardProps {
  book: Book;
  index?: number;
}

export function BookCard({ book, index = 0 }: BookCardProps) {
  const progress = book.page_count > 0
    ? Math.round((book.current_page / book.page_count) * 100)
    : 0;

  return (
    <Link
      href={`/books/${book.id}`}
      className="group block animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${Math.min(index * 30, 400)}ms`, animationDuration: '400ms' }}
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-card to-card/60 border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1">
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-muted/80 via-muted to-muted/60">
          {book.cover_path ? (
            <img
              src={`/api/cover-image/${book.id}`}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
              <FileText className="h-14 w-14" strokeWidth={1.2} />
              <p className="text-[10px] uppercase tracking-widest font-medium">No Cover</p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Hover action */}
          <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <BookOpen className="h-3.5 w-3.5" />
              Open Book
            </span>
          </div>

          {/* Reading progress ribbon */}
          {book.status === 'reading' && book.page_count > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <p className="font-semibold text-sm leading-tight line-clamp-2 text-foreground/90">
            {book.title}
          </p>
          {book.author && (
            <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
              {book.author}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 pt-1">
            <StatusBadge status={book.status} />
            {book.page_count > 0 && (
              <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                {book.page_count}p
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
