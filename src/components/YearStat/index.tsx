import { lazy, Suspense, LazyExoticComponent, ComponentType } from 'react';
import useActivities from '@/hooks/useActivities';
import { formatPace } from '@/utils/utils';
import useHover from '@/hooks/useHover';
import { yearStats } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { CalendarIcon, FootprintsIcon, HeartIcon } from '@/components/icons';

// Cache the lazy year-SVG component per year. Creating a fresh `lazy()` on every
// render made React re-suspend the Suspense boundary on each parent re-render
// (e.g. clicking a Recent Pathways row), which flashed the "loading..." fallback
// and re-loaded the radial chart. Caching keeps the component identity stable.
const yearSvgCache: Record<string, LazyExoticComponent<ComponentType<any>>> = {};
const getYearSvg = (year: string) => {
  if (!yearSvgCache[year]) {
    yearSvgCache[year] = lazy(() => loadSvgComponent(yearStats, `./year_${year}.svg`));
  }
  return yearSvgCache[year];
};

const YearStat = ({ year, onClick, defaultExpanded = false }: { year: string, onClick: (_year: string) => void, defaultExpanded?: boolean }) => {
  let { activities: runs, years } = useActivities();
  const [hovered, eventHandlers] = useHover();
  const YearSVG = getYearSvg(year);

  if (years.includes(year)) {
    runs = runs.filter((run) => run.start_date_local.slice(0, 4) === year);
  }
  let sumDistance = 0;
  let streak = 0;
  let heartRate = 0;
  let heartRateNullCount = 0;
  let totalMetersAvail = 0;
  let totalSecondsAvail = 0;
  runs.forEach((run) => {
    sumDistance += run.distance || 0;
    if (run.average_speed) {
      totalMetersAvail += run.distance || 0;
      totalSecondsAvail += (run.distance || 0) / run.average_speed;
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

  // Total spans the whole row (it is the only card in that grid row), so its
  // four figures sit in one line.  A single year sits in the narrow left
  // column next to the table, where a compact 2x2 grid is the only thing that
  // fits.
  const statsGridClass = isTotal
    ? 'grid grid-cols-2 sm:grid-cols-4 gap-3'
    : 'grid grid-cols-2 gap-2';
  const statsBoxClass = isTotal
    ? 'bg-surfaceSoft rounded-2xl px-4 py-3 text-center'
    : 'bg-surfaceSoft rounded-xl px-2 py-2';
  const statsValueClass = isTotal
    ? 'text-xl font-bold text-ink whitespace-nowrap'
    : 'text-base font-bold text-ink whitespace-nowrap';

  return (
    <div
      className="cursor-pointer select-none outline-none w-full h-full"
      onClick={() => onClick(year)}
      {...eventHandlers}
    >
      {/* Stacked vertically: figures on top, radial chart underneath.  The card
          now lives in the narrow left column, where side-by-side put the chart
          at ~120px wide; full width suits the ring far better. */}
      <div className="card flex h-full flex-col p-4 shadow-sm yearstat-card">
        <div className="flex items-center gap-2 mb-3">
          {isTotal ? (
            <FootprintsIcon size={22} className="text-ink" />
          ) : (
            <CalendarIcon size={22} className="text-ink" />
          )}
          <h3 className="font-sans text-xl font-bold text-ink">
            {isTotal ? 'Total Journey' : `${year} Journey`}
          </h3>
        </div>

        <div className={statsGridClass}>
          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Runs</p>
            <p className={statsValueClass}>{runs.length}</p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Distance</p>
            <p className={statsValueClass}>{sumDistance} <span className="text-xs">KM</span></p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Avg Pace</p>
            <p className={statsValueClass}>{avgPace}</p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">Streak</p>
            <p className={statsValueClass}>{streak} <span className="text-xs">Days</span></p>
          </div>
        </div>

        {hasHeartRate && (
          <div className="mt-3 bg-surfaceSoft rounded-xl p-3 flex items-center gap-2">
            <HeartIcon size={18} className="text-accent" />
            <p className="text-muted text-[10px] font-bold uppercase">Avg HR:</p>
            <p className="text-base font-bold text-ink">{avgHeartRate} <span className="text-xs">BPM</span></p>
          </div>
        )}

        {!isTotal && (hovered || defaultExpanded) && (
          <Suspense fallback="loading...">
            <div className="yearChart mt-3 flex flex-1 items-center justify-center">
              <YearSVG className="w-full max-w-[270px] h-auto" />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default YearStat;
