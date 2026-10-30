import useActivities from '@/hooks/useActivities';

const YearNav = ({ year, onClick }: { year: string; onClick: (_year: string) => void }) => {
  const { years } = useActivities();

  const base = years.slice();
  if (!base.includes('Total')) base.push('Total');
  const list = [year, ...base.filter((y) => y !== year)];
  const unique = Array.from(new Set(list));

  return (
    <nav className="nav-pill flex flex-wrap justify-center gap-2 mb-6">
      {unique.map((y) => {
        const active = y === year;
        return (
          <button
            key={y}
            onClick={() => onClick(y)}
            className={
              'px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ' +
              (active
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface border border-line text-muted hover:text-accentInk hover:border-accent/40')
            }
          >
            {y}
          </button>
        );
      })}
    </nav>
  );
};

export default YearNav;
