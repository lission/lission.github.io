import useActivities from '@/hooks/useActivities';
import { BuildingIcon } from '@/components/icons';

const CitiesStat = ({ onClick }: { onClick: (_city: string) => void }) => {
  const { cities } = useActivities();

  const citiesArr = Object.entries(cities);
  citiesArr.sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ink mb-3 flex items-center gap-2">
        <BuildingIcon size={20} className="text-ink" />
        城市足迹
      </h4>
      <div className="flex flex-wrap gap-2">
        {citiesArr.map(([city, distance]) => (
          <button
            key={city}
            onClick={() => onClick(city)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-all duration-200 hover:border-accent/40 hover:text-accentInk"
          >
            {city}
            <span className="text-xs text-accentInk">{(distance / 1000).toFixed(0)}km</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CitiesStat;
