import useActivities from '@/hooks/useActivities';
import { MapIcon } from '@/components/icons';

const LocationSummary = () => {
  const { years, countries, provinces, cities } = useActivities();
  
  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ink mb-3 flex items-center gap-2">
        <MapIcon size={20} className="text-ink" />
        跑步地图
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {years && (
          <div className="card p-3 shadow-sm">
            <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1 break-words">Years</p>
            <p className="text-xl font-bold text-ink">{years.length}</p>
          </div>
        )}
        {countries && (
          <div className="card p-3 shadow-sm">
            <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1 break-words">Countries</p>
            <p className="text-xl font-bold text-ink">{countries.length}</p>
          </div>
        )}
        {provinces && (
          <div className="card p-3 shadow-sm">
            <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1 break-words">Provinces</p>
            <p className="text-xl font-bold text-ink">{provinces.length}</p>
          </div>
        )}
        {cities && (
          <div className="card p-3 shadow-sm">
            <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1 break-words">Cities</p>
            <p className="text-xl font-bold text-ink">{Object.keys(cities).length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSummary;
