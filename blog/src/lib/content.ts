import type { PostPage } from '../types';

type JsonModule = { default: unknown };
type Loader = () => Promise<JsonModule>;

// 内容索引与文章 HTML 一律按需加载：跑步首页不会下载任何博客数据。
const indexLoaders = import.meta.glob('../../content/*.json') as unknown as Record<string, Loader>;
const pageLoaders = import.meta.glob('../../content/pages/*.json') as unknown as Record<
  string,
  Loader
>;

export const loadIndex = async <T>(name: string): Promise<T> => {
  const loader = indexLoaders[`../../content/${name}.json`];
  if (!loader) {
    throw new Error(`缺少内容索引 ${name}.json，请先执行 pnpm publish:notes`);
  }
  return (await loader()).default as T;
};

export const loadPage = async (slug: string): Promise<PostPage | null> => {
  const loader = pageLoaders[`../../content/pages/${slug}.json`];
  if (!loader) return null;
  return (await loader()).default as PostPage;
};
