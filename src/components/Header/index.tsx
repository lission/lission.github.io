import { Link } from 'react-router-dom';
import useSiteMetadata from '@/hooks/useSiteMetadata';

const Header = () => {
  const { logo, siteUrl, navLinks } = useSiteMetadata();

  return (
    <header className="mb-4">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to={siteUrl}>
            <picture>
              <img 
                className="h-12 w-12 rounded-full border-2 border-ghibli-green shadow-md" 
                alt="logo" 
                src={logo} 
              />
            </picture>
          </Link>
          <h1 className="font-sans text-2xl md:text-[2.2rem] font-bold text-ghibli-text border-b-2 border-dotted border-ghibli-accent leading-tight">
            跑步日记
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-semibold mt-4 md:mt-0">
          {navLinks.map((n, i) => (
            <a
              key={i}
              href={n.url}
              className="text-ghibli-nav hover:text-ghibli-accent transition-all duration-200 hover:-translate-y-0.5"
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
