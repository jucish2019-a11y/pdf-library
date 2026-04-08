'use client';

import { useState, type ReactNode } from 'react';
import type { Collection } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'
];

interface CollectionDialogProps {
  children: ReactNode;
  collection?: Collection;
  onSaved?: () => void;
}

export function CollectionDialog({ children, collection, onSaved }: CollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [color, setColor] = useState(collection?.color || PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const method = collection ? 'PATCH' : 'POST';
      const url = collection ? `/api/collections/${collection.id}` : '/api/collections';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, color }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(collection ? 'Collection updated' : 'Collection created');
      setOpen(false);
      onSaved?.();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;
    if (!confirm(`Delete "${collection.name}"?`)) return;
    try {
      await fetch(`/api/collections/${collection.id}`, { method: 'DELETE' });
      toast.success('Collection deleted');
      setOpen(false);
      onSaved?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => {
      setOpen(v);
      if (v) {
        setName(collection?.name || '');
        setDescription(collection?.description || '');
        setColor(collection?.color || PRESET_COLORS[0]);
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{collection ? 'Edit Collection' : 'New Collection'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Collection name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
          />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Color</p>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {collection && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
