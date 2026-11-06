export interface ReadingGroup {
  id: string;
  label: string;
  count: number;
  order: number;
}

export interface ReadingPost {
  type: 'reading';
  slug: string;
  title: string;
  group: string;
  tags: string[];
  date: string | null;
  author: string | null;
  source: string;
}

export interface NotePost {
  type: 'note';
  year: string;
  date: string | null;
  slug: string;
  title: string;
  source: string;
}

export interface NotesIndex {
  years: { year: string; count: number }[];
  posts: NotePost[];
}

export interface BookItem {
  seq: number;
  title: string;
  titleRaw: string;
  author: string;
  category: string;
  dateRaw: string;
  startDate: string | null;
  endDate: string | null;
  medium: string;
  note: string;
  status: '已完成' | '在读' | '暂停';
  relatedSlug: string | null;
}

export interface BookYear {
  year: string;
  note: string;
  count: number;
  items: BookItem[];
}

export interface BooksIndex {
  source: string;
  available: boolean;
  total: number;
  stats: {
    finished: number;
    reading: number;
    paused: number;
    thisYear: number;
    byCategory: Record<string, number>;
  };
  years: BookYear[];
  fallbackHtml: string;
  sourceRowCount: number;
  parsedCount: number;
  warnings: string[];
}

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

export interface PostPage {
  type: 'reading' | 'note';
  slug: string;
  title: string;
  group?: string;
  year?: string;
  date?: string | null;
  author?: string | null;
  tags: string[];
  source: string;
  html: string;
  toc: TocItem[];
}

export interface SidebarLink {
  key: string;
  label: string;
  to: string;
}

export interface SidebarSection {
  id: string;
  label: string;
  count: number;
  children: SidebarLink[];
}
