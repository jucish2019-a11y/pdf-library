'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { UploadDialog } from '@/components/upload/UploadDialog';
import { ThemeToggle } from './ThemeToggle';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onBooksChange?: () => void;
}

export function Header({ onBooksChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-6 py-3">
        <div className="flex-1">
          <SearchBar />
        </div>
        <UploadDialog onUploaded={onBooksChange}>
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </UploadDialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
