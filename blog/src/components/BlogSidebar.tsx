import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { SidebarSection } from '../types';

interface BlogSidebarProps {
  title: string;
  sections: SidebarSection[];
  storageKey: string;
  activeKey?: string;
  /** 让桌面侧栏卡片撑满 grid 行高，与右侧内容区等高。 */
  stretch?: boolean;
}

const readState = (key: string): Record<string, boolean> => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
};

/** 数据驱动的可折叠树：桌面常驻侧栏，移动端收成抽屉。 */
const BlogSidebar = ({
  title,
  sections,
  storageKey,
  activeKey,
  stretch = false,
}: BlogSidebarProps) => {
  const location = useLocation();
  const [open, setOpen] = useState<Record<string, boolean>>(() => readState(storageKey));
  const [drawer, setDrawer] = useState(false);
  const ids = sections.map((section) => section.id).join('|');

  // 分组 / 年份是动态发现的：新出现的分组默认展开，旧状态按 id 容错保留。
  useEffect(() => {
    setOpen((previous) => {
      const next = { ...previous };
      let changed = false;
      for (const section of sections) {
        if (!(section.id in next)) {
          next[section.id] = true;
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [ids]);

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname, location.search]);

  const toggle = (id: string) => {
    setOpen((previous) => {
      const next = { ...previous, [id]: !(previous[id] ?? true) };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // localStorage 不可用时仅保留内存状态
      }
      return next;
    });
  };

  const tree = (fill = false) => (
    <div className={`card p-4 ${fill ? 'flex h-full min-h-0 flex-col' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ink">{title}</p>
        <span className="text-xs text-muted">{sections.length} 组</span>
      </div>
      {sections.length === 0 && <p className="text-xs text-muted">暂无内容</p>}
      <div className={`space-y-1 ${fill ? 'blog-scroll min-h-0 flex-1 overflow-y-auto' : ''}`}>
        {sections.map((section) => {
          const expanded = open[section.id] ?? true;
          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggle(section.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-surfaceSoft"
              >
                <span className="truncate">{section.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-muted">
                  {section.count}
                  <span className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                    ›
                  </span>
                </span>
              </button>
              {expanded && section.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-0.5 border-l border-line pl-3">
                  {section.children.map((child) => (
                    <li key={child.key}>
                      <Link
                        to={child.to}
                        title={child.label}
                        className={`block truncate rounded-lg px-2 py-1 text-xs transition-colors ${
                          activeKey === child.key
                            ? 'bg-accent/10 font-semibold text-accentInk'
                            : 'text-muted hover:bg-surfaceSoft hover:text-accentInk'
                        }`}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-muted shadow-sm transition-colors hover:text-accentInk lg:hidden"
      >
        {title} · {sections.length} 组
      </button>
      <aside className={`hidden w-60 shrink-0 lg:block ${stretch ? 'relative' : ''}`}>
        {stretch ? (
          // 绝对定位让侧栏内容不参与 grid 行高计算，行高完全由右侧内容决定；
          // 卡片再撑满这个行高，分组过多时只在卡片内部滚动。
          <div className="absolute inset-0">{tree(true)}</div>
        ) : (
          <div className="blog-scroll sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {tree()}
          </div>
        )}
      </aside>
      {drawer && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="presentation"
          onClick={() => setDrawer(false)}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div
            className="blog-scroll absolute left-0 top-0 h-full w-[19rem] overflow-y-auto bg-paper p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted"
              >
                关闭
              </button>
            </div>
            {tree()}
          </div>
        </div>
      )}
    </>
  );
};

export default BlogSidebar;
