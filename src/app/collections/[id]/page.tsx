'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { BookGrid } from '@/components/library/BookGrid';
import type { Collection } from '@/types';

export default function CollectionPage({ params }: { params: { id: string } }) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`/api/collections/${params.id}`).then(r => r.json()).then(setCollection);
  }, [params.id]);

  return (
    <>
      <Header onBooksChange={() => setRefreshKey(k => k + 1)} />
      <main className="flex-1 p-6">
        {collection && (
          <div className="flex items-center gap-3 mb-6">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: collection.color }} />
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-muted-foreground text-sm">{collection.description}</p>
            )}
          </div>
        )}
        <BookGrid collectionId={params.id} refreshKey={refreshKey} />
      </main>
    </>
  );
}
