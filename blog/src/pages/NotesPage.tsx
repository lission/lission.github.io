import { Link, useParams, useSearchParams } from 'react-router-dom';
import BlogPage from '../components/BlogPage';
import BlogSidebar from '../components/BlogSidebar';
import PageHeader from '../components/PageHeader';
import StateCard from '../components/StateCard';
import { loadIndex } from '../lib/content';
import { useContent } from '../lib/useContent';
import type { NotesIndex, NotePost, SidebarSection } from '../types';

const NotesPage = () => {
  const { year } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useContent<NotesIndex>(async () => loadIndex<NotesIndex>('notes'), []);
  const ascending = searchParams.get('sort') === 'asc';
  const data = state.data;

  const setSort = (next: 'asc' | 'desc') => {
    const params = new URLSearchParams(searchParams);
    if (next === 'asc') params.set('sort', 'asc');
    else params.delete('sort');
    setSearchParams(params, { replace: true });
  };
  const sortQuery = ascending ? '?sort=asc' : '';

  // 排序同时作用于年份分组顺序与组内日期顺序，切换后整页顺序都会变化。
  const yearEntries = data
    ? [...data.years].sort((a, b) => {
        if (a.year === '未标年份') return 1;
        if (b.year === '未标年份') return -1;
        const order = a.year < b.year ? -1 : a.year > b.year ? 1 : 0;
        return ascending ? order : -order;
      })
    : [];

  const sortedPosts = data
    ? [...data.posts].sort((a, b) => {
        const left = a.date ?? '';
        const right = b.date ?? '';
        if (left === right) return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
        if (!left) return 1;
        if (!right) return -1;
        const order = left < right ? -1 : 1;
        return ascending ? order : -order;
      })
    : [];

  const sections: SidebarSection[] = yearEntries.map((entry) => ({
    id: entry.year,
    label: `${entry.year} 年`,
    count: entry.count,
    children: sortedPosts
      .filter((post) => post.year === entry.year)
      .map((post) => ({
        key: post.slug,
        label: `${post.date ? `${post.date.slice(5)} · ` : ''}${post.title}`,
        to: `/notes/${post.year}/${post.slug}`,
      })),
  }));

  const groupedByYear = yearEntries
    .filter((entry) => !year || entry.year === year)
    .map((entry) => ({
      year: entry.year,
      posts: sortedPosts.filter((post: NotePost) => post.year === entry.year),
    }))
    .filter((entry) => entry.posts.length > 0);

  return (
    <BlogPage
      title={year ? `${year} 年随笔` : '随笔'}
      description="随笔"
    >
      <PageHeader
        icon="notes"
        title={year ? `${year} 年随笔` : '随笔'}
        extra={
          <div className="flex items-center gap-2">
            <Link
              to={`/notes${sortQuery}`}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                year
                  ? 'border border-line bg-surface text-muted hover:text-accentInk'
                  : 'bg-accent text-onAccent shadow-sm'
              }`}
            >
              全部
            </Link>
            <div className="inline-flex items-center rounded-full border border-line bg-surface p-1">
              {[
                { key: 'desc' as const, label: '倒序' },
                { key: 'asc' as const, label: '正序' },
              ].map((option) => {
                const active = option.key === (ascending ? 'asc' : 'desc');
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSort(option.key)}
                    aria-label={`日期${option.label}`}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-accent text-onAccent shadow-sm'
                        : 'text-muted hover:text-accentInk'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {state.loading && <StateCard title="正在加载随笔…" />}
      {state.error && <StateCard title="内容加载失败" description={state.error} to="/" />}
      {data && (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <BlogSidebar
            title="随笔年份"
            sections={sections}
            storageKey="blog-notes-tree"
            activeKey={year}
          />
          <main className="min-w-0 space-y-5">
            {groupedByYear.length === 0 && (
              <StateCard title="这个年份还没有随笔" description="回到全部年份看看。" to="/notes" />
            )}
            {groupedByYear.map((entry) => (
              <section key={entry.year} className="card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-ink">{entry.year} 年</h2>
                  <span className="text-xs text-muted">{entry.posts.length} 篇</span>
                </div>
                <div className="space-y-3">
                  {entry.posts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/notes/${post.year}/${post.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-accentInk">
                          {post.title}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {post.date ?? '未标日期'} · {post.year} 年
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">↗</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      )}
    </BlogPage>
  );
};

export default NotesPage;
