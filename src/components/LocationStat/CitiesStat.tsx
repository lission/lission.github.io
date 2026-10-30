import useActivities from '@/hooks/useActivities';
import { BuildingIcon } from '@/components/icons';

const CitiesStat = ({ onClick }: { onClick: (_city: string) => void }) => {
  const { cities, unlocatedRuns, unlocatedDistance } = useActivities();

  const citiesArr = Object.entries(cities);
  citiesArr.sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ink mb-3 flex items-center gap-2">
        <BuildingIcon size={20} className="text-accentInk" />
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
            <span className="text-xs text-accentInk">{(distance / 1000).toFixed(0)}公里</span>
          </button>
        ))}
        {unlocatedRuns > 0 && (
          <span
            title={`${unlocatedRuns} 条记录没有地点信息（异地比赛或同步时未能反查地点），不计入上面的城市统计`}
            className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-muted"
          >
            未标注地点
            <span className="text-xs">{(unlocatedDistance / 1000).toFixed(0)}公里</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default CitiesStat;
