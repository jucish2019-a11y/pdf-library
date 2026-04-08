'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Collection } from '@/types';
import { CollectionDialog } from '@/components/collections/CollectionDialog';
import { BookOpen, Library, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const [collections, setCollections] = useState<Collection[]>([]);

  const fetchCollections = () => {
    fetch('/api/collections').then(r => r.json()).then(setCollections);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base tracking-tight">PDF Library</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === '/'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Library className="h-4 w-4" />
          All Books
        </Link>

        {collections.length > 0 && (
          <div className="pt-3 pb-1">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Collections
            </p>
            {collections.map(col => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === `/collections/${col.id}`
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span className="truncate">{col.name}</span>
                {col.book_count !== undefined && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {col.book_count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <CollectionDialog onSaved={fetchCollections}>
          <button className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Plus className="h-4 w-4" />
            New Collection
          </button>
        </CollectionDialog>
      </div>
    </aside>
  );
}
