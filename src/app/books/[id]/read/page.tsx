'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import type { Book } from '@/types';

const PdfReader = dynamic(
  () => import('@/components/reader/PdfReader').then(m => ({ default: m.PdfReader })),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50">Loading reader…</div> }
);

export default function ReadPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch(`/api/books/${params.id}`).then(r => r.json()).then(setBook);
  }, [params.id]);

  const handlePageChange = (page: number) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/books/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_page: page }),
      });
    }, 1000);
  };

  if (!book) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50">Loading…</div>;
  }

  return (
    <PdfReader
      bookId={params.id}
      initialPage={book.current_page || 1}
      onClose={() => router.back()}
      onPageChange={handlePageChange}
    />
  );
}
