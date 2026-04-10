import useActivities from '@/hooks/useActivities';

const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  
  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ghibli-text mb-3 flex items-center gap-2">
        🌍 跑步地图
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {years && (
          <div className="ghibli-card p-3 shadow-sm">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Years</p>
            <p className="text-xl font-bold text-ghibli-text">{years.length}</p>
          </div>
        )}
        {countries && (
          <div className="ghibli-card p-3 shadow-sm">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Countries</p>
            <p className="text-xl font-bold text-ghibli-text">{countries.length}</p>
          </div>
        )}
        {provinces && (
          <div className="ghibli-card p-3 shadow-sm">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Provinces</p>
            <p className="text-xl font-bold text-ghibli-text">{provinces.length}</p>
          </div>
        )}
        {cities && (
          <div className="ghibli-card p-3 shadow-sm">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Cities</p>
            <p className="text-xl font-bold text-ghibli-text">{Object.keys(cities).length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSummary;
