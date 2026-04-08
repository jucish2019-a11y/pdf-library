'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Collection } from '@/types';
import { CollectionDialog } from '@/components/collections/CollectionDialog';
import { Library, Plus, Sparkles } from 'lucide-react';
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
    <aside className="w-64 shrink-0 border-r border-border/60 bg-gradient-to-b from-card via-card to-card/80 flex flex-col h-screen sticky top-0 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/40 blur-lg rounded-full" />
          <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight leading-none">PDF Library</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            Your collection
          </p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <Link
          href="/"
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative overflow-hidden',
            pathname === '/'
              ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {pathname === '/' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
          )}
          <Library className="h-4 w-4" />
          All Books
        </Link>

        {collections.length > 0 && (
          <div className="pt-5 pb-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Collections
            </p>
            <div className="space-y-0.5">
              {collections.map(col => {
                const active = pathname === `/collections/${col.id}`;
                return (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className={cn(
                      'group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all relative overflow-hidden',
                      active
                        ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card transition-all group-hover:scale-110"
                      style={{ backgroundColor: col.color, boxShadow: `0 0 12px ${col.color}50` }}
                    />
                    <span className="truncate flex-1">{col.name}</span>
                    {col.book_count !== undefined && col.book_count > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground/70 font-medium">
                        {col.book_count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* New collection button */}
      <div className="px-3 py-3 border-t border-border/60">
        <CollectionDialog onSaved={fetchCollections}>
          <button className="group flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent border border-dashed border-border/60 hover:border-primary/30">
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            New Collection
          </button>
        </CollectionDialog>
      </div>
    </aside>
  );
}
