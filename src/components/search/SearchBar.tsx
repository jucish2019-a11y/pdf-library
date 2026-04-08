'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Book } from '@/types';
import { Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setResults(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 200);
    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-full pl-4 pr-3 py-2.5 bg-muted/60 border transition-all',
          focused
            ? 'border-primary/40 bg-background shadow-lg shadow-primary/5 ring-4 ring-primary/10'
            : 'border-border/60 hover:border-border'
        )}
      >
        <Search className={cn('h-4 w-4 shrink-0 transition-colors', focused ? 'text-primary' : 'text-muted-foreground')} />
        <input
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground/70"
          placeholder="Search your library..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 200); }}
        />
        {query && (
          <kbd className="hidden sm:inline-flex text-[10px] font-mono bg-muted/80 border border-border rounded px-1.5 py-0.5 text-muted-foreground">
            ESC
          </kbd>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/80 rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-1.5">
            {results.map(book => (
              <button
                key={book.id}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-xl hover:bg-muted transition-colors"
                onMouseDown={() => { router.push(`/books/${book.id}`); setQuery(''); setOpen(false); }}
              >
                <div className="h-9 w-7 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                  {book.cover_path ? (
                    <img src={`/api/cover-image/${book.id}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  {book.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
