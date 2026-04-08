'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Book } from '@/types';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setResults(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-muted/40 focus-within:border-primary transition-colors">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Search books..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.map(book => (
            <button
              key={book.id}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted transition-colors"
              onMouseDown={() => { router.push(`/books/${book.id}`); setQuery(''); setOpen(false); }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{book.title}</p>
                {book.author && <p className="text-xs text-muted-foreground truncate">{book.author}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
