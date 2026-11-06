import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BlogPage from './BlogPage';
import StateCard from './StateCard';
import { loadIndex, loadPage } from '../lib/content';
import { useContent } from '../lib/useContent';
import type { NotesIndex, ReadingPost } from '../types';

interface PostPageViewProps {
  slug: string;
  type: 'reading' | 'note';
  backTo: string;
  backLabel: string;
}

const PostPageView = ({ slug, type, backTo, backLabel }: PostPageViewProps) => {
  const location = useLocation();
  const state = useContent(async () => {
    const page = await loadPage(slug);
    if (!page || page.type !== type) return null;
    if (type === 'reading') {
      const posts = await loadIndex<ReadingPost[]>('reading');
      return { page, meta: posts.find((post) => post.slug === slug) ?? null };
    }
    const notes = await loadIndex<NotesIndex>('notes');
    return { page, meta: notes.posts.find((post) => post.slug === slug) ?? null };
  }, [slug, type]);

  useEffect(() => {
    if (!state.data || !location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [state.data, location.hash]);

  const page = state.data?.page;
  const meta = state.data?.meta;

  return (
    <BlogPage title={page?.title ?? '笔记'} description={page ? `${page.title} · 笔记正文` : undefined}>
      <Link
        to={backTo}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted shadow-sm transition-colors hover:text-accentInk"
      >
        ← {backLabel}
      </Link>

      {state.loading && <StateCard title="正在加载笔记…" />}
      {state.error && (
        <StateCard title="内容加载失败" description={state.error} to={backTo} linkLabel={backLabel} />
      )}
      {!state.loading && !state.error && !page && (
        <StateCard
          title="没有找到这篇笔记"
          description="链接可能已经失效，回到列表看看其它内容吧。"
          to={backTo}
          linkLabel={backLabel}
        />
      )}

      {page && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <article className="card min-w-0 p-5 sm:p-8">
            <header className="mb-6 border-b border-line pb-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                {meta && 'group' in meta && (
                  <Link
                    to={`/reading?group=${encodeURIComponent(meta.group)}`}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-accentInk"
                  >
                    {meta.group}
                  </Link>
                )}
                {meta && 'date' in meta && meta.date && <span>{meta.date}</span>}
                {meta && 'year' in meta && (
                  <Link
                    to={`/notes/${meta.year}`}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-accentInk"
                  >
                    {meta.year}
                  </Link>
                )}
                {meta && 'tags' in meta &&
                  meta.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surfaceSoft px-2.5 py-1">
                      {tag}
                    </span>
                  ))}
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {page.title}
              </h1>
            </header>
            <div className="post-content" dangerouslySetInnerHTML={{ __html: page.html }} />
          </article>

          {page.toc.length > 1 && (
            <aside className="hidden lg:block">
              <div className="blog-scroll card sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto p-4">
                <p className="mb-3 text-sm font-bold text-ink">本文目录</p>
                <ul className="space-y-1">
                  {page.toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        title={item.text}
                        className="block truncate text-xs text-muted transition-colors hover:text-accentInk"
                        style={{ paddingLeft: `${Math.max(0, item.level - 1) * 12}px` }}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      )}
    </BlogPage>
  );
};

export default PostPageView;
