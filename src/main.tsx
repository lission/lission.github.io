import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import NotFound from './pages/404';
import ReactGA from 'react-ga4';
import {
  GOOGLE_ANALYTICS_TRACKING_ID,
  USE_GOOGLE_ANALYTICS,
} from './utils/const';
import '@/styles/index.css';
import { withOptionalGAPageTracking } from './utils/trackRoute';
import { ThemeProvider } from '@/hooks/useTheme';
import { prefetchForPath, routeLoaders, type PageLoader } from './routePrefetch';

if (USE_GOOGLE_ANALYTICS) {
  ReactGA.initialize(GOOGLE_ANALYTICS_TRACKING_ID);
}

// 直接打开博客深链时，入口 JS 一执行就并行预取页面组件与内容索引，
// 不必等 React 渲染到 Suspense 才发起请求。跑步首页不预取任何博客资源。
if (typeof window !== 'undefined') {
  prefetchForPath(window.location.pathname);
}

const BlogFallback = () => (
  <div className="max-w-[1120px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
    <div className="card p-6 text-sm text-muted">页面加载中…</div>
  </div>
);

// 所有路由页面按需加载：首页不再把 2 MB 的 activities.json 挂到全局
// modulepreload 上，博客页面也不会下载跑步数据，反之亦然。
const lazyPage = (factory: PageLoader) => {
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
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/'])),
    },
    {
      path: '/reading',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/reading'])),
    },
    {
      path: '/reading/:slug',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/reading/:slug'])),
    },
    {
      path: '/notes',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/notes'])),
    },
    {
      path: '/notes/:year',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/notes/:year'])),
    },
    {
      path: '/notes/:year/:slug',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/notes/:year/:slug'])),
    },
    {
      path: '/books',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/books'])),
    },
    {
      path: '/about',
      element: withOptionalGAPageTracking(lazyPage(routeLoaders['/about'])),
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
