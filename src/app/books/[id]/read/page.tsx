'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PdfReader } from '@/components/reader/PdfReader';
import type { Book } from '@/types';

const EpubReader = dynamic(
  () => import('@/components/reader/EpubReader').then(m => ({ default: m.EpubReader })),
  { ssr: false }
);

export default function ReadPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    fetch(`/api/books/${params.id}`).then(r => r.json()).then(setBook);
  }, [params.id]);

  if (!book) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white/50">
        Loading…
      </div>
    );
  }

  const onClose = () => router.back();

  if (book.file_type === 'epub') {
    return <EpubReader bookId={params.id} title={book.title} onClose={onClose} />;
  }

  return <PdfReader bookId={params.id} title={book.title} onClose={onClose} />;
}
