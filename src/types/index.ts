export type ReadStatus = 'to-read' | 'reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  filename: string;
  file_path: string;
  cover_path: string | null;
  status: ReadStatus;
  page_count: number;
  current_page: number;
  rating: number | null;
  notes: string;
  date_added: number;
  date_updated: number;
  tags?: string[];
  collections?: { id: string; name: string; color: string }[];
}

export interface Tag {
  id: string;
  name: string;
  count?: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: number;
  book_count?: number;
}
