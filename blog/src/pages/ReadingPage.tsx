import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import BlogPage from '../components/BlogPage';
import BlogSidebar from '../components/BlogSidebar';
import FilterPills from '../components/FilterPills';
import PageHeader from '../components/PageHeader';
import StateCard from '../components/StateCard';
import { loadIndex } from '../lib/content';
import { useContent } from '../lib/useContent';
import type { ReadingGroup, ReadingPost, SidebarSection } from '../types';

interface ReadingData {
  groups: ReadingGroup[];
  posts: ReadingPost[];
}

// 与跑步页表格一致：每页固定行数，卡片高度稳定、底边与侧栏齐平。
const PAGE_SIZE = 10;

const pillClass =
  'inline-flex whitespace-nowrap rounded-full bg-surfaceSoft px-2.5 py-0.5 text-[11px] font-semibold text-muted';

// 与跑步页「最近跑步记录」卡片内的分页按钮保持完全一致。
const pagerButtonClass =
  'inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition-colors ' +
  'hover:border-accent/40 hover:text-accentInk disabled:cursor-not-allowed disabled:opacity-30 ' +
  'disabled:hover:border-line disabled:hover:text-ink';

const ReadingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const listRef = useRef<HTMLElement>(null);
  const state = useContent<ReadingData>(
    async () => ({
      groups: await loadIndex<ReadingGroup[]>('groups'),
      posts: await loadIndex<ReadingPost[]>('reading'),
    }),
    []
  );

  const group = searchParams.get('group') ?? '';
  // 无 sort 参数即按日期倒序；仅 ?sort=asc 时切换为升序。
  const ascending = searchParams.get('sort') === 'asc';
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);

  // 深链 / 浏览器后退时，把 URL 里的关键词同步回输入框。
  useEffect(() => {
    setQuery(q);
  }, [q]);

  // 输入即时过滤，防抖写回 URL：中文输入法期间不会每敲一个字都触发路由更新。
  useEffect(() => {
    if (query.trim() === q) return undefined;
    const timer = window.setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (query.trim()) next.set('q', query.trim());
          else next.delete('q');
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, q]);

  const setGroup = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('group', value);
    else next.delete('group');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  // 日期表头：默认降序，点击切换为升序，再点回到默认降序。
  const toggleSort = () => {
    const next = new URLSearchParams(searchParams);
    if (ascending) next.delete('sort');
    else next.set('sort', 'asc');
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const goToPage = (target: number) => {
    const next = new URLSearchParams(searchParams);
    if (target <= 1) next.delete('page');
    else next.set('page', String(target));
    setSearchParams(next, { replace: true });
  };

  const data = state.data;
  const keyword = query.trim().toLowerCase();
  const filteredPosts = data
    ? data.posts.filter(
        (post) =>
          (!group || post.group === group) &&
          (!keyword ||
            `${post.title} ${post.author ?? ''}`.toLowerCase().includes(keyword))
      )
    : [];
  // 默认按日期倒序；无日期的笔记始终沉底，避免升序时「—」占据前排。
  const direction = ascending ? 1 : -1;
  const visiblePosts = [...filteredPosts].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    if (a.date === b.date) return 0;
    return (a.date > b.date ? 1 : -1) * direction;
  });
  const ariaSort: 'ascending' | 'descending' = ascending ? 'ascending' : 'descending';
  const pageCount = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1),
    pageCount
  );
  const pagedPosts = visiblePosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 翻页后把视图带回列表顶部，避免停留在新一页的底部。
  useEffect(() => {
    if (currentPage > 1) {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const sections: SidebarSection[] = data
    ? data.groups.map((entry) => ({
        id: entry.id,
        label: entry.label,
        count: entry.count,
        children: data.posts
          .filter((post) => post.group === entry.id)
          .map((post) => ({ key: post.slug, label: post.title, to: `/reading/${post.slug}` })),
      }))
    : [];

  return (
    <BlogPage title="阅读笔记" description="阅读笔记">
      <PageHeader
        icon="reading"
        title="阅读笔记"
        extra={
          data && (
            <div className="flex gap-2">
              {[
                { label: '笔记', value: data.posts.length },
                { label: '分组', value: data.groups.length },
              ].map((item) => (
                <div key={item.label} className="card px-3 py-2 text-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          )
        }
      />

      {state.loading && <StateCard title="正在加载阅读笔记…" />}
      {state.error && <StateCard title="内容加载失败" description={state.error} to="/" />}
      {data && (
        <div className="grid items-stretch gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <BlogSidebar
            title="阅读笔记"
            sections={sections}
            storageKey="blog-reading-tree"
            stretch
          />
          <main ref={listRef} className="min-w-0 scroll-mt-6 space-y-5">
            <div className="card space-y-3 p-4">
              <FilterPills
                label="分组"
                options={data.groups.map((entry) => entry.id)}
                value={group}
                onChange={setGroup}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索书名 / 作者"
                aria-label="搜索书名或作者"
                className="w-full rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-ink outline-none transition-colors focus:border-accent/40"
              />
            </div>

            {visiblePosts.length === 0 ? (
              <StateCard title="没有匹配的笔记" description="换个分组或关键词试试。" />
            ) : (
              <div className="card flex flex-col overflow-hidden shadow-sm">
                <div className="flex-1 overflow-x-auto">
                  <table className="reading-table">
                    <thead>
                      <tr>
                        <th scope="col">名称</th>
                        <th scope="col">作者</th>
                        <th scope="col">分组</th>
                        <th scope="col" aria-sort={ariaSort}>
                          <button
                            type="button"
                            className="reading-sort-button"
                            onClick={toggleSort}
                            aria-label={`按日期排序，当前${ascending ? '升序' : '降序'}`}
                          >
                            日期
                            <span aria-hidden="true" className="reading-sort-mark">
                              {ascending ? '↑' : '↓'}
                            </span>
                          </button>
                        </th>
                        <th scope="col">查看</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPosts.map((post) => {
                        const open = () => navigate(`/reading/${post.slug}`);
                        const meta = [post.author, post.date].filter(Boolean).join(' · ');
                        return (
                          <tr
                            key={post.slug}
                            role="link"
                            tabIndex={0}
                            aria-label={`阅读 ${post.title}`}
                            onClick={open}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                open();
                              }
                            }}
                          >
                            <td className="font-medium text-ink">
                              {post.title}
                              {meta && <span className="reading-meta-inline">{meta}</span>}
                            </td>
                            <td className="whitespace-nowrap">
                              {post.author ?? <span className="text-muted">—</span>}
                            </td>
                            <td>
                              <span className={pillClass}>{post.group}</span>
                            </td>
                            <td className="reading-date-cell">
                              {post.date ?? <span className="text-muted">—</span>}
                            </td>
                            <td className="text-muted">↗</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-3 py-2">
                  <p className="text-xs text-muted">
                    共 <span className="font-semibold text-ink">{visiblePosts.length}</span> 篇
                    <span className="mx-1.5 text-line">·</span>
                    第 <span className="font-semibold text-ink">{currentPage}</span> /{' '}
                    {pageCount} 页
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="上一页"
                      className={pagerButtonClass}
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <ChevronLeftIcon size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="下一页"
                      className={pagerButtonClass}
                      disabled={currentPage >= pageCount}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      <ChevronRightIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </BlogPage>
  );
};

export default ReadingPage;
