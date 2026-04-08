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
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground truncate flex-1 font-medium">{book.title}</span>
        <Link href={`/books/${params.id}/read`}>
          <button className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary/85 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
            <BookOpen className="h-4 w-4" />
            Read Now
          </button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Subtle background gradient */}
      <div className="relative flex-1">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[120px] -z-10 pointer-events-none" />

        <div className="p-8 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-10">
            {/* Cover */}
            <div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="relative rounded-2xl overflow-hidden border border-border/60 aspect-[3/4] bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-2xl shadow-black/20">
                  {book.cover_path ? (
                    <img
                      src={`/api/cover-image/${book.id}`}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-20 w-20 text-muted-foreground/20" strokeWidth={1.2} />
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                {book.page_count > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-semibold tabular-nums">{book.page_count}</span>
                  </div>
                )}
                {book.current_page > 0 && book.page_count > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-muted-foreground text-xs">Progress</span>
                      <span className="text-xs font-semibold tabular-nums">
                        {Math.round((book.current_page / book.page_count) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${(book.current_page / book.page_count) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Title</label>
              <Input
                className="mt-1 text-2xl font-serif font-bold border-transparent bg-transparent px-0 h-auto py-1 focus-visible:ring-0 focus-visible:border-b focus-visible:border-border rounded-none shadow-none"
                value={book.title}
                onChange={e => { setBook(b => b ? { ...b, title: e.target.value } : b); debouncedSave({ title: e.target.value }); }}
              />
            </div>

            {/* Author */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Author</label>
              <Input
                className="mt-1 text-base italic font-serif border-transparent bg-transparent px-0 h-auto py-1 focus-visible:ring-0 focus-visible:border-b focus-visible:border-border rounded-none shadow-none"
                placeholder="Unknown author"
                value={book.author}
                onChange={e => { setBook(b => b ? { ...b, author: e.target.value } : b); debouncedSave({ author: e.target.value }); }}
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Status</label>
              <div className="flex gap-2 mt-2.5">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setBook(b => b ? { ...b, status: opt.value } : b); save({ status: opt.value }); }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      book.status === opt.value
                        ? 'border-primary bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Rating</label>
              <div className="flex gap-1.5 mt-2.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => { setBook(b => b ? { ...b, rating: star } : b); save({ rating: star }); }}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-6 w-6 transition-all ${
                        book.rating && star <= book.rating
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'text-muted-foreground/25 hover:text-amber-400/60'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Tags</label>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {book.tags?.map(tag => (
                  <span
                    key={tag}
                    className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-xs font-medium text-primary transition-all hover:from-primary/15 hover:to-primary/10"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 text-primary/60 hover:bg-primary/20 hover:text-primary transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative mt-2.5">
                <Input
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
                  }}
                  className="pr-8 rounded-full bg-muted/50 border-border/60 focus-visible:bg-background"
                />
                {tagInput && (
                  <button
                    onClick={() => addTag(tagInput)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {tagInput && suggestedTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border/80 rounded-2xl shadow-2xl shadow-black/10 z-10 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="p-1.5">
                      {suggestedTags.map(t => (
                        <button
                          key={t.id}
                          className="block w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
                          onMouseDown={() => addTag(t.name)}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Collections</label>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {collections.map(col => {
                    const active = book.collections?.some(c => c.id === col.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => toggleCollection(col.id)}
                        className={`inline-flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? 'border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm'
                            : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: col.color, boxShadow: `0 0 8px ${col.color}40` }}
                        />
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Notes</label>
              <Textarea
                className="mt-2.5 resize-none font-serif leading-relaxed bg-muted/40 border-border/60 rounded-xl focus-visible:bg-background transition-colors"
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
    </div>
  );
}
