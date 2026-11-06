import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import ThemeToggle from '@/components/ThemeToggle';
import { prefetchForPath } from '@/routePrefetch';

const Divider = () => <span className="h-4 w-px shrink-0 bg-line" aria-hidden="true" />;

const linkClass = (active: boolean) =>
  'text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 ' +
  (active ? 'text-accentInk' : 'text-muted hover:text-accentInk');

const Header = () => {
  const { logo, siteTitle, navLinks } = useSiteMetadata();
  const { pathname } = useLocation();
  const links = [{ name: '跑步', url: '/' }, ...navLinks];

  return (
    <header className="flex justify-center px-3 pt-5 pb-3">
      <div className="nav-pill inline-flex min-w-0 max-w-full items-center gap-2 overflow-x-auto rounded-full border border-line bg-surface px-3 py-2 shadow-sm [&::-webkit-scrollbar]:hidden [scrollbar-width:none] sm:gap-3 sm:px-4">
        <Link to="/" className="flex shrink-0 items-center">
          <picture>
            <img className="h-8 w-8 shrink-0" alt="logo" src={logo} />
          </picture>
          <h1 className="sr-only">{siteTitle}</h1>
        </Link>
        <nav className="flex items-center gap-2.5 font-semibold sm:gap-3">
          {links.map((item) => {
            const external = /^https?:\/\//.test(item.url);
            const active =
              !external &&
              (pathname === item.url ||
                (item.url !== '/' && pathname.startsWith(`${item.url}/`)));
            // 指针/键盘/触摸接触时提前取回该路由的页面 chunk 与内容索引，
            // 点击时动态 import 直接命中模块缓存。
            const warm = () => prefetchForPath(item.url);
            return (
              <Fragment key={item.url}>
                <Divider />
                {external ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className={linkClass(active)}>
                    {item.name}
                  </a>
                ) : (
                  <Link
                    to={item.url}
                    className={linkClass(active)}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={warm}
                    onFocus={warm}
                    onTouchStart={warm}
                  >
                    {item.name}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>
        <Divider />
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
