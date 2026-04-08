'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Book, Collection, Tag } from '@/types';
import { StatusBadge } from '@/components/library/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Star, Trash2, FileText, X, Plus
} from 'lucide-react';
import type { ReadStatus } from '@/types';

const STATUS_OPTIONS: { value: ReadStatus; label: string }[] = [
  { value: 'to-read', label: 'To Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
];

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch(`/api/books/${params.id}`).then(r => r.json()).then(setBook);
    fetch('/api/collections').then(r => r.json()).then(setCollections);
    fetch('/api/tags').then(r => r.json()).then(setAllTags);
  }, [params.id]);

  type BookPatch = Omit<Partial<Book>, 'collections'> & { tags?: string[]; collections?: string[] };

  const save = async (patch: BookPatch) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/books/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setBook(updated);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = (patch: BookPatch) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(patch), 600);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this book? This cannot be undone.')) return;
    await fetch(`/api/books/${params.id}`, { method: 'DELETE' });
    toast.success('Book deleted');
    router.push('/');
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || book?.tags?.includes(trimmed)) return;
    const newTags = [...(book?.tags ?? []), trimmed];
    setBook(b => b ? { ...b, tags: newTags } : b);
    save({ tags: newTags });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const newTags = (book?.tags ?? []).filter(t => t !== tag);
    setBook(b => b ? { ...b, tags: newTags } : b);
    save({ tags: newTags });
  };

  const toggleCollection = (colId: string) => {
    const current = book?.collections?.map(c => c.id) ?? [];
    const newCols = current.includes(colId)
      ? current.filter(id => id !== colId)
      : [...current, colId];
    save({ collections: newCols });
  };

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const suggestedTags = allTags.filter(t =>
    t.name.includes(tagInput.toLowerCase()) && !book.tags?.includes(t.name)
  ).slice(0, 5);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground truncate flex-1">{book.title}</span>
        <Link href={`/books/${params.id}/read`}>
          <Button size="sm" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Read
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          {/* Cover */}
          <div>
            <div className="rounded-xl overflow-hidden border border-border aspect-[3/4] bg-muted flex items-center justify-center">
              {book.cover_path ? (
                <img
                  src={`/api/cover-image/${book.id}`}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="h-16 w-16 text-muted-foreground/30" />
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {book.page_count > 0 && <p>{book.page_count} pages</p>}
              {book.current_page > 0 && (
                <p>Page {book.current_page} of {book.page_count}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
              <Input
                className="mt-1 text-lg font-semibold border-transparent bg-transparent px-0 focus-visible:ring-0 focus-visible:border-border"
                value={book.title}
                onChange={e => { setBook(b => b ? { ...b, title: e.target.value } : b); debouncedSave({ title: e.target.value }); }}
              />
            </div>

            {/* Author */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</label>
              <Input
                className="mt-1 border-transparent bg-transparent px-0 focus-visible:ring-0 focus-visible:border-border"
                placeholder="Unknown author"
                value={book.author}
                onChange={e => { setBook(b => b ? { ...b, author: e.target.value } : b); debouncedSave({ author: e.target.value }); }}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <div className="flex gap-2 mt-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setBook(b => b ? { ...b, status: opt.value } : b); save({ status: opt.value }); }}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      book.status === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => { setBook(b => b ? { ...b, rating: star } : b); save({ rating: star }); }}
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        book.rating && star <= book.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30 hover:text-amber-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.tags?.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative mt-2">
                <Input
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
                  }}
                  className="pr-8"
                />
                {tagInput && (
                  <button
                    onClick={() => addTag(tagInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {tagInput && suggestedTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10">
                    {suggestedTags.map(t => (
                      <button
                        key={t.id}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onMouseDown={() => addTag(t.name)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collections</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {collections.map(col => {
                    const active = book.collections?.some(c => c.id === col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => toggleCollection(col.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          active
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
              <Textarea
                className="mt-2 resize-none"
                placeholder="Your thoughts about this book…"
                rows={5}
                value={book.notes}
                onChange={e => {
                  setBook(b => b ? { ...b, notes: e.target.value } : b);
                  debouncedSave({ notes: e.target.value });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
