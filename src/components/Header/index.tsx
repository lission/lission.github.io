import { Link } from 'react-router-dom';
import useSiteMetadata from '@/hooks/useSiteMetadata';

const Header = () => {
  const { logo, siteUrl, navLinks } = useSiteMetadata();

  return (
    <header className="flex justify-center pt-5 pb-3">
      <div className="nav-pill inline-flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-sm">
        <Link to={siteUrl} className="flex items-center gap-2.5">
          <picture>
            <img
              className="h-8 w-8 shrink-0"
              alt="logo"
              src={logo}
            />
          </picture>
          <h1 className="font-sans text-lg font-bold text-ink leading-none">
            跑步日记
          </h1>
        </Link>
        <span className="h-5 w-px bg-line" aria-hidden="true" />
        <nav className="flex items-center gap-5 font-semibold">
          {navLinks.map((n, i) => (
            <a
              key={i}
              href={n.url}
              className="text-sm text-muted hover:text-accentInk transition-all duration-200 hover:-translate-y-0.5"
            >
              {n.name}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
