import { Link } from 'react-router-dom';
import BlogPage from '../components/BlogPage';
import PageHeader from '../components/PageHeader';
import useSiteMetadata from '@/hooks/useSiteMetadata';

const SECTIONS = [
  { to: '/', label: '跑步日记', description: '不自律跑步记录' },
  { to: '/reading', label: '阅读笔记', description: '触动灵魂的文字' },
  { to: '/notes', label: '随笔', description: '关于生活的琐碎' },
  { to: '/books', label: '书单', description: '散乱的阅读清单' },
];

const AboutPage = () => {
  const { siteTitle, siteUrl } = useSiteMetadata();

  return (
    <BlogPage title="关于" description="关于本站与内容组织方式">
      <PageHeader
        icon="about"
        title="关于本站"
        description="一个记录跑步、阅读与日常的个人小站。"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-ink">{siteTitle}</h2>
            <div className="post-content">
              <p>跑过些路，读了点书，记下日常，试着找寻属于自己的“生活的另外部分”。</p>
              <p>不存在虚掷光阴、蹉跎岁月，只要是认真度过的日子，最后都不会设有意义，碌碌亦有为。</p>
              <p>怀着怨恨的人生是不值得过的。</p>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-ink">站点导航</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECTIONS.map((section) => (
                <Link
                  key={section.to}
                  to={section.to}
                  className="group rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
                >
                  <p className="text-sm font-bold text-ink transition-colors group-hover:text-accentInk">
                    {section.label}
                  </p>
                  <p className="mt-1 text-xs text-muted">{section.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <p className="mb-3 text-sm font-bold text-ink">技术栈</p>
            <ul className="space-y-2 text-xs text-muted">
              {['React 18 + Vite', 'React Router', 'Tailwind CSS', 'GitHub Pages / Actions'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="card p-5">
            <p className="mb-3 text-sm font-bold text-ink">源码</p>
            <div className="flex flex-col gap-2 text-xs">
              <a
                href="https://github.com/lission/lission.github.io"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accentInk hover:underline"
              >
                站点仓库 ↗
              </a>
              <a
                href="https://github.com/lission/markDownNote"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accentInk hover:underline"
              >
                笔记仓库 ↗
              </a>
              <a href={siteUrl} className="text-muted hover:text-accentInk">
                {siteUrl}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </BlogPage>
  );
};

export default AboutPage;
