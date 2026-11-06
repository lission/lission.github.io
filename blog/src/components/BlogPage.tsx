import type { ReactNode } from 'react';
import Layout from '@/components/Layout';
import '../styles.css';

interface BlogPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** 复用跑步站的 Layout / Header / 主题切换，仅覆盖页面标题与描述。 */
const BlogPage = ({ title, description, children }: BlogPageProps) => (
  <Layout title={title} description={description}>
    <div className="blog-page">{children}</div>
  </Layout>
);

export default BlogPage;
