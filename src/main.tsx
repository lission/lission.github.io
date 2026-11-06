import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Index from './pages';
import NotFound from './pages/404';
import ReactGA from 'react-ga4';
import {
  GOOGLE_ANALYTICS_TRACKING_ID,
  USE_GOOGLE_ANALYTICS,
} from './utils/const';
import '@/styles/index.css';
import { withOptionalGAPageTracking } from './utils/trackRoute';
import { ThemeProvider } from '@/hooks/useTheme';

if (USE_GOOGLE_ANALYTICS) {
  ReactGA.initialize(GOOGLE_ANALYTICS_TRACKING_ID);
}

const BlogFallback = () => (
  <div className="max-w-[1120px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
    <div className="card p-6 text-sm text-muted">页面加载中…</div>
  </div>
);

// 博客页面按需加载：跑步首页不会下载任何博客索引或文章 chunk。
const lazyPage = (factory: () => Promise<{ default: React.ComponentType }>) => {
  const Page = React.lazy(factory);
  return (
    <React.Suspense fallback={<BlogFallback />}>
      <Page />
    </React.Suspense>
  );
};

const routes = createBrowserRouter(
  [
    {
      path: '/',
      element: withOptionalGAPageTracking(<Index />),
    },
    {
      path: '/reading',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/ReadingPage'))),
    },
    {
      path: '/reading/:slug',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/ReadingPostPage'))),
    },
    {
      path: '/notes',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/NotesPage'))),
    },
    {
      path: '/notes/:year',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/NotesPage'))),
    },
    {
      path: '/notes/:year/:slug',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/NotePostPage'))),
    },
    {
      path: '/books',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/BooksPage'))),
    },
    {
      path: '/about',
      element: withOptionalGAPageTracking(lazyPage(() => import('@blog/pages/AboutPage'))),
    },
    {
      path: '*',
      element: withOptionalGAPageTracking(<NotFound />),
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        <RouterProvider router={routes} />
      </HelmetProvider>
    </ThemeProvider>
  </React.StrictMode>
);
