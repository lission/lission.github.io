import useActivities from '@/hooks/useActivities';

const CitiesStat = ({ onClick }: { onClick: (_city: string) => void }) => {
  const { cities } = useActivities();

  const citiesArr = Object.entries(cities);
  citiesArr.sort((a, b) => b[1] - a[1]);
  
  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ghibli-text mb-3 flex items-center gap-2">
        🏙️ 城市足迹
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {citiesArr.map(([city, distance]) => (
          <div
            key={city}
            className="ghibli-card p-3 shadow-sm cursor-pointer hover:shadow-ghibli"
            onClick={() => onClick(city)}
          >
            <p className="font-semibold text-ghibli-text">{city}</p>
            <p className="text-sm text-ghibli-accent">{(distance / 1000).toFixed(0)} KM</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CitiesStat;
