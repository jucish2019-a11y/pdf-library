'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BookGrid } from '@/components/library/BookGrid';

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <Header onBooksChange={() => setRefreshKey(k => k + 1)} />
      <main className="flex-1 p-6">
        <BookGrid refreshKey={refreshKey} />
      </main>
    </>
  );
}
