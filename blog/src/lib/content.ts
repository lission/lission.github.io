import type { PostPage } from '../types';

// 四个索引静态打包进博客路由 chunk：列表页与详情页渲染时数据已在本地，
// 不再为索引单独发起动态 import（消除第二级加载瀑布）。
// 文章正文仍按需加载，避免把 45 篇全文塞进同一个 chunk。
import groups from '../../content/groups.json';
import reading from '../../content/reading.json';
import notes from '../../content/notes.json';
import books from '../../content/books.json';

const indexes: Record<string, unknown> = { groups, reading, notes, books };

type JsonModule = { default: unknown };
type Loader = () => Promise<JsonModule>;

const pageLoaders = import.meta.glob('../../content/pages/*.json') as unknown as Record<
  string,
  Loader
>;

/** 保持 async 签名，调用方（useContent / Promise.all）无需改动。 */
export const loadIndex = async <T>(name: string): Promise<T> => {
  const data = indexes[name];
  if (!data) {
    throw new Error(`缺少内容索引 ${name}.json，请先执行 pnpm publish:notes`);
  }
  return data as T;
};

export const loadPage = async (slug: string): Promise<PostPage | null> => {
  const loader = pageLoaders[`../../content/pages/${slug}.json`];
  if (!loader) return null;
  return (await loader()).default as PostPage;
};
