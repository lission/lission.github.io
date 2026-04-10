import { lazy, Suspense } from 'react';
import useActivities from '@/hooks/useActivities';
import { formatPace } from '@/utils/utils';
import useHover from '@/hooks/useHover';
import { yearStats } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';

const YearStat = ({ year, onClick }: { year: string, onClick: (_year: string) => void }) => {
  let { activities: runs, years } = useActivities();
  const [hovered, eventHandlers] = useHover();
  const YearSVG = lazy(() => loadSvgComponent(yearStats, `./year_${year}.svg`));

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let pace = 0;
  let paceNullCount = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  let totalMetersAvail = 0;
  let totalSecondsAvail = 0;
  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    if (run.average_speed) {
      pace += run.average_speed;
      totalMetersAvail += run.distance || 0;
      totalSecondsAvail += (run.distance || 0) / run.average_speed;
    } else {
      paceNullCount++;
    }
    if (run.average_heartrate) {
      heartRate += run.average_heartrate;
    } else {
      heartRateNullCount++;
    }
    if (run.streak) {
      streak = Math.max(streak, run.streak);
    }
  });
  sumDistance = parseFloat((sumDistance / 1000.0).toFixed(1));
  const avgPace = formatPace(totalMetersAvail / totalSecondsAvail);
  const hasHeartRate = !(heartRate === 0);
  const avgHeartRate = (heartRate / (runs.length - heartRateNullCount)).toFixed(0);

  const isTotal = year === 'Total';

  return (
    <div
      className="cursor-pointer"
      onClick={() => onClick(year)}
      {...eventHandlers}
    >
      <div className="ghibli-card p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{isTotal ? '🏃‍♂️' : '📅'}</span>
          <h3 className="font-sans text-xl font-bold text-ghibli-text">
            {isTotal ? 'Total Journey' : `${year} Journey`}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ghibli-surface-low rounded-ghibli-sm p-3">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Runs</p>
            <p className="text-xl font-bold text-ghibli-text">{runs.length}</p>
          </div>
          
          <div className="bg-ghibli-surface-low rounded-ghibli-sm p-3">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Distance</p>
            <p className="text-xl font-bold text-ghibli-text">{sumDistance} <span className="text-sm">KM</span></p>
          </div>
          
          <div className="bg-ghibli-surface-low rounded-ghibli-sm p-3">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Avg Pace</p>
            <p className="text-xl font-bold text-ghibli-text">{avgPace}</p>
          </div>
          
          <div className="bg-ghibli-surface-low rounded-ghibli-sm p-3">
            <p className="text-ghibli-tan text-xs font-bold uppercase tracking-wider mb-1">Streak</p>
            <p className="text-xl font-bold text-ghibli-text">{streak} <span className="text-sm">Days</span></p>
          </div>
        </div>
        
        {hasHeartRate && (
          <div className="mt-3 bg-ghibli-surface-low rounded-ghibli-sm p-3 flex items-center gap-2">
            <span className="text-lg">❤️</span>
            <p className="text-ghibli-tan text-xs font-bold uppercase">Avg HR:</p>
            <p className="text-lg font-bold text-ghibli-text">{avgHeartRate} <span className="text-sm">BPM</span></p>
          </div>
        )}
      </div>
      
      {!isTotal && hovered && (
        <Suspense fallback="loading...">
          <YearSVG className="my-4 h-4/6 w-4/6 border-0 p-0" />
        </Suspense>
      )}
    </div>
  );
};

export default YearStat;
