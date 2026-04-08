# PDF Library

A sleek, local-first web app for managing your personal ebook collection. Upload **PDF** and **EPUB** files, organize them with tags and collections, track reading status, and read them in-browser with rotation, themes, and fullscreen support.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-lightgrey)

## Features

- **Upload PDF & EPUB** files via drag-and-drop, with automatic title, author, and cover extraction
- **Organize** books with tags, collections, read status (to-read / reading / read), ratings, and notes
- **In-browser reader** — PDF viewer with rotation; EPUB reader with reflowable pages, themes (dark/light/sepia), TOC, and persistent reading position
- **Full-text search** across titles, authors, and notes (SQLite FTS5)
- **Dark mode** and a polished UI built with Tailwind CSS and shadcn/ui
- **Fully local** — all data lives in a single `data/` directory on your machine

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui + Framer Motion
- **Database:** SQLite via `better-sqlite3` with FTS5 full-text search
- **PDF:** `pdf-parse` for metadata, `pdfjs-dist` for cover extraction, native browser viewer for reading
- **EPUB:** `jszip` for server-side metadata + cover extraction, `epubjs` / `react-reader` for in-browser reading
- **Other:** `next-themes`, `sonner`, `lucide-react`

## Prerequisites

- **Node.js 18.17+** (20.x recommended) — <https://nodejs.org>
- **npm** (ships with Node)
- **Python + C++ build tools** (only needed if `better-sqlite3` prebuilt binaries aren't available on your platform)
  - Windows: `npm install --global windows-build-tools` or install Visual Studio Build Tools
  - macOS: `xcode-select --install`
  - Linux: `sudo apt-get install build-essential python3`

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/jucish2019-a11y/pdf-library.git
cd pdf-library

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000> in your browser.

On first launch the app automatically:
- Creates the `data/` directory with `library.db`, `uploads/`, and `covers/` subfolders
- Initializes the SQLite schema (books, tags, collections, FTS5 index)

No `.env` or external services required.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the production bundle |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
pdf-library/
├── data/                     # git-ignored — SQLite DB + uploaded PDFs + covers
│   ├── library.db
│   ├── uploads/              # <uuid>.pdf
│   └── covers/               # <uuid>.png
├── public/
│   └── pdf.worker.min.mjs    # pdfjs worker (served locally)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # library grid
│   │   ├── books/[id]/page.tsx           # book detail
│   │   ├── books/[id]/read/page.tsx      # in-browser reader
│   │   ├── collections/[id]/page.tsx
│   │   └── api/                          # REST endpoints
│   ├── components/
│   │   ├── layout/                       # Sidebar, Header, ThemeToggle
│   │   ├── library/                      # BookGrid, BookCard, StatusBadge
│   │   ├── upload/                       # UploadDialog, DropZone, CoverExtractor
│   │   ├── reader/                       # PdfReader
│   │   └── search/                       # SearchBar
│   ├── db/                               # Drizzle schema + sqlite singleton
│   ├── lib/                              # books, collections, search, pdf-meta, file-store
│   └── types/
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Usage

1. **Upload a PDF** — click *Upload PDF* in the header, drop one or more files. Title, page count, and cover thumbnail are extracted automatically.
2. **Organize** — open any book to edit title/author, add tags, assign to collections, set status, rating, and notes. Changes save automatically.
3. **Read** — click *Read Now* for the full-screen viewer. Press `r` to rotate, `Esc` to exit.
4. **Search** — use the header search bar to fuzzy-match across your library.
5. **Collections** — create themed collections from the sidebar to group related books.

## Data & Privacy

Everything is stored locally in `./data/`:
- `library.db` — SQLite database with all metadata
- `uploads/` — original PDF files
- `covers/` — extracted cover PNGs

The `data/` directory is in `.gitignore` and never leaves your machine. To back up your library, copy the folder. To reset, delete it — the app will recreate it on next launch.

## Troubleshooting

**`better-sqlite3` fails to install**
Native bindings need a C++ toolchain. Install the build tools listed in [Prerequisites](#prerequisites) and re-run `npm install`.

**"Failed to load PDF" in the reader**
The reader uses the browser's built-in PDF viewer via an iframe. Make sure your browser has PDF viewing enabled (Chrome/Edge/Firefox all support it by default).

**Database is locked**
Stop any other dev server instances — SQLite only allows one writer at a time. The app sets a 10s busy timeout to reduce conflicts during hot reload.

**Port 3000 already in use**
Run `npm run dev -- -p 3001` to use a different port.

## License

MIT — use it, fork it, make it yours.
