/**
 * 路由级代码拆分的共享加载器。
 *
 * main.tsx 用它创建 React.lazy 页面，Header 在悬停/聚焦时预取同一批 chunk；
 * 模块 id 相同，动态 import 会命中同一份模块缓存，不会重复下载。
 * 内容索引已静态打包进博客路由 chunk，无需再单独预取；
 * 跑步首页静置时不会请求任何博客资源。
 */
import type { ComponentType } from 'react';

export type PageLoader = () => Promise<{ default: ComponentType }>;

export const routeLoaders: Record<string, PageLoader> = {
  '/': () => import('./pages'),
  '/reading': () => import('@blog/pages/ReadingPage'),
  '/reading/:slug': () => import('@blog/pages/ReadingPostPage'),
  '/notes': () => import('@blog/pages/NotesPage'),
  '/notes/:year': () => import('@blog/pages/NotesPage'),
  '/notes/:year/:slug': () => import('@blog/pages/NotePostPage'),
  '/books': () => import('@blog/pages/BooksPage'),
  '/about': () => import('@blog/pages/AboutPage'),
};

const prefetched = new Set<string>();

const prefetch = (route: string) => {
  if (prefetched.has(route)) return;
  const loader = routeLoaders[route];
  if (!loader) return;
  prefetched.add(route);
  void loader().catch(() => prefetched.delete(route));
};

/** 按路径（含 SPA 深链）预取页面组件；内容索引随该 chunk 一起到达。 */
export const prefetchForPath = (pathname: string) => {
  if (/^https?:\/\//.test(pathname)) return;
  let route = '/';
  if (pathname.startsWith('/reading')) {
    route = pathname === '/reading' ? '/reading' : '/reading/:slug';
  } else if (pathname.startsWith('/notes')) {
    route = /^\/notes\/\d{4}\/.+/.test(pathname) ? '/notes/:year/:slug' : '/notes';
  } else if (pathname.startsWith('/books')) {
    route = '/books';
  } else if (pathname.startsWith('/about')) {
    route = '/about';
  }
  prefetch(route);
};
