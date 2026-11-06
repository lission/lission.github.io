import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BlogPage from '../components/BlogPage';
import BlogSidebar from '../components/BlogSidebar';
import FilterPills from '../components/FilterPills';
import PageHeader from '../components/PageHeader';
import StateCard from '../components/StateCard';
import { loadIndex } from '../lib/content';
import { useContent } from '../lib/useContent';
import type { BookItem, BooksIndex, SidebarSection } from '../types';

const STATUSES = ['已完成', '在读', '暂停'];
const TABLE_HEADERS = ['序号', '书名', '作者', '类型', '时间', '书质', '状态', '备注'];

const statusClass = (status: BookItem['status']) =>
  'rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ' +
  (status === '已完成'
    ? 'bg-accent/10 text-accentInk'
    : status === '在读'
      ? 'bg-surfaceSoft text-ink'
      : 'bg-surfaceSoft text-muted');

const categoryList = (category: string) =>
  category.split(/[、,，/]/).map((part) => part.trim()).filter(Boolean);

const BooksPage = () => {
  const location = useLocation();
  const state = useContent<BooksIndex>(async () => loadIndex<BooksIndex>('books'), []);
  const data = state.data;

  const [category, setCategory] = useState('');
  const [medium, setMedium] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [sortByDate, setSortByDate] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') ?? '');
  }, [location.search]);

  useEffect(() => {
    if (!data || !location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [data, location.hash]);

  const allItems = data ? data.years.flatMap((year) => year.items) : [];
  const categoryOptions = useMemo(
    () => [...new Set(allItems.flatMap((item) => categoryList(item.category)))].sort(),
    [data]
  );
  const mediumOptions = useMemo(
    () => [...new Set(allItems.map((item) => item.medium).filter(Boolean))].sort(),
    [data]
  );

  const matches = (item: BookItem) => {
    const keyword = query.trim().toLowerCase();
    return (
      (!status || item.status === status) &&
      (!medium || item.medium === medium) &&
      (!category || categoryList(item.category).includes(category)) &&
      (!keyword ||
        `${item.title} ${item.author} ${item.category} ${item.note}`.toLowerCase().includes(keyword))
    );
  };

  const visibleYears = data
    ? data.years
        .map((year) => {
          const items = year.items.filter(matches);
          if (sortByDate) {
            items.sort((a, b) => {
              const left = a.startDate ?? '';
              const right = b.startDate ?? '';
              if (left === right) return a.seq - b.seq;
              return left < right ? 1 : -1;
            });
          }
          return { ...year, items };
        })
        .filter((year) => year.items.length > 0)
    : [];

  const sections: SidebarSection[] = data
    ? data.years.map((year) => ({
        id: year.year,
        label: `${year.year} 年`,
        count: year.count,
        children: year.items.map((item) => ({
          key: `${year.year}-${item.seq}-${item.title}`,
          label: item.title,
          to: `/books?q=${encodeURIComponent(item.title)}`,
        })),
      }))
    : [];

  const stats = data
    ? [
        { label: '累计册数', value: data.total, unit: '册' },
        { label: '本年度', value: data.stats.thisYear, unit: '册' },
        { label: '在读', value: data.stats.reading, unit: '本' },
        { label: '暂停', value: data.stats.paused, unit: '本' },
      ]
    : [];

  const relatedLink = (item: BookItem) =>
    item.relatedSlug && (
      <Link
        to={`/reading/${item.relatedSlug}`}
        className="text-xs font-semibold text-accentInk hover:underline"
      >
        阅读笔记 ↗
      </Link>
    );

  return (
    <BlogPage title="书单" description="阅读书单">
      <PageHeader
        icon="books"
        title="阅读书单"
        extra={
          <button
            type="button"
            onClick={() => setShowRaw((value) => !value)}
            className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-muted shadow-sm transition-colors hover:text-accentInk"
          >
            {showRaw ? '返回结构化书单' : '查看原始清单'}
          </button>
        }
      />

      {state.loading && <StateCard title="正在加载书单…" />}
      {state.error && <StateCard title="内容加载失败" description={state.error} to="/" />}

      {data && !data.available && (
        <StateCard
          title="暂无书单"
          description="书单来源未配置或已在排除清单中。"
          to="/"
        />
      )}

      {data && data.available && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="card p-3 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {item.label}
                </p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {item.value}
                  <span className="ml-1 text-xs font-semibold text-accentInk">{item.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {data.sourceRowCount !== data.parsedCount && (
            <div className="mb-5 rounded-2xl border border-line bg-surfaceSoft px-4 py-3 text-xs leading-relaxed text-muted">
              源表格 {data.sourceRowCount} 行，成功解析 {data.parsedCount} 条。如有缺漏，请点「查看原始清单」核对。
            </div>
          )}

          {showRaw ? (
            <div className="card p-5 sm:p-8">
              <div className="post-content" dangerouslySetInnerHTML={{ __html: data.fallbackHtml }} />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <BlogSidebar
                title="书单年份"
                sections={sections}
                storageKey="blog-books-tree"
              />
              <main className="min-w-0 space-y-5">
                <div className="card space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜索书名 / 作者"
                      className="min-w-[10rem] flex-1 rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-ink outline-none transition-colors focus:border-accent/40"
                    />
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted outline-none"
                      aria-label="按类型筛选"
                    >
                      <option value="">全部类型</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortByDate((value) => !value)}
                      className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-accentInk"
                    >
                      {sortByDate ? '按阅读时间' : '按原序'}
                    </button>
                  </div>
                  <FilterPills
                    label="状态"
                    options={STATUSES}
                    value={status}
                    onChange={setStatus}
                  />
                  <FilterPills
                    label="书质"
                    options={mediumOptions}
                    value={medium}
                    onChange={setMedium}
                  />
                </div>

                {visibleYears.length === 0 && (
                  <StateCard title="没有匹配的书" description="换个关键词或清空筛选条件试试。" />
                )}

                {visibleYears.map((year) => (
                  <section key={year.year} id={`year-${year.year}`} className="card p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-ink">{year.year} 年</h2>
                      <span className="text-xs text-muted">{year.items.length} 册</span>
                    </div>
                    {year.note && <p className="mb-4 text-xs text-muted">{year.note}</p>}

                    <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
                      <div className="overflow-x-auto">
                        <table className="books-table w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-line bg-accent/[0.07]">
                              {TABLE_HEADERS.map((label, index) => (
                                <th
                                  key={label}
                                  scope="col"
                                  className={`whitespace-nowrap py-2.5 pl-3.5 pr-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted ${
                                    index === 0 ? 'border-l-[3px] border-l-accent pl-3' : ''
                                  } ${index === TABLE_HEADERS.length - 1 ? 'pr-4' : ''}`}
                                >
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {year.items.map((item) => (
                              <tr key={`${item.seq}-${item.title}`}>
                                <td className="px-3.5 py-2.5 text-muted">{item.seq}</td>
                                <td className="px-3.5 py-2.5 font-semibold text-ink">
                                  {item.title}
                                  <div className="mt-0.5">{relatedLink(item)}</div>
                                </td>
                                <td className="px-3.5 py-2.5 text-muted">{item.author || '—'}</td>
                                <td className="px-3.5 py-2.5 text-muted">{item.category}</td>
                                <td className="px-3.5 py-2.5 text-muted whitespace-nowrap">
                                  {item.dateRaw || '—'}
                                </td>
                                <td className="px-3.5 py-2.5 text-muted">{item.medium || '—'}</td>
                                <td className="px-3.5 py-2.5">
                                  <span className={statusClass(item.status)}>{item.status}</span>
                                </td>
                                <td className="px-3.5 py-2.5 text-muted">{item.note || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {year.items.map((item) => (
                        <div
                          key={`${item.seq}-${item.title}`}
                          className="rounded-2xl border border-line bg-surface p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-snug text-ink">{item.title}</p>
                            <span className={statusClass(item.status)}>{item.status}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted">
                            {item.author || '—'} · {item.category} · {item.medium || '—'}
                          </p>
                          <p className="mt-1 text-xs text-muted">{item.dateRaw || '未标注时间'}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {relatedLink(item)}
                            {item.note && <span className="text-xs text-muted">{item.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </main>
            </div>
          )}
        </>
      )}
    </BlogPage>
  );
};

export default BooksPage;
