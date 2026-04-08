'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { UploadDialog } from '@/components/upload/UploadDialog';
import { ThemeToggle } from './ThemeToggle';
import { Upload } from 'lucide-react';

interface HeaderProps {
  onBooksChange?: () => void;
}

export function Header({ onBooksChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-3.5">
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>
        <UploadDialog onUploaded={onBooksChange}>
          <button className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary/85 hover:from-primary hover:to-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
            <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Upload PDF
          </button>
        </UploadDialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
