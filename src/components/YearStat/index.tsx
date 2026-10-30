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

  // Total spans the whole row and shows all five figures (incl. heart rate) in
  // one line.  A single year sits in the narrow left column next to the table,
  // where a compact 2x2 grid plus a full-width heart-rate tile is what fits.
  const statsGridClass = isTotal
    ? 'grid grid-cols-2 sm:grid-cols-5 gap-3'
    : 'grid grid-cols-2 gap-2';
  const statsBoxClass = isTotal
    ? 'bg-surfaceSoft rounded-2xl px-4 py-3 text-center'
    : 'bg-surfaceSoft rounded-xl px-2 py-2 text-center';
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
            <FootprintsIcon size={22} className="text-accentInk" />
          ) : (
            <CalendarIcon size={22} className="text-accentInk" />
          )}
          <h3 className="font-sans text-xl font-bold text-ink">
            {isTotal ? '全部跑步历程' : `${year} 跑步历程`}
          </h3>
        </div>

        <div className={statsGridClass}>
          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">次数</p>
            <p className={statsValueClass}>{runs.length}</p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">距离</p>
            <p className={statsValueClass}>{sumDistance} <span className="text-xs">公里</span></p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">平均配速</p>
            <p className={statsValueClass}>{avgPace}</p>
          </div>

          <div className={statsBoxClass}>
            <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">连续天数</p>
            <p className={statsValueClass}>{streak} <span className="text-xs">天</span></p>
          </div>

          {hasHeartRate && isTotal && (
            <div className={statsBoxClass}>
              <p className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <HeartIcon size={14} className="text-accent" />
                平均心率
              </p>
              <p className={statsValueClass}>{avgHeartRate} <span className="text-xs">次/分</span></p>
            </div>
          )}
        </div>

        {/* In a single year's narrow column the heart-rate tile drops below the
            2x2 grid; in Total view it already joined the grid above. */}
        {hasHeartRate && !isTotal && (
          <div className="mt-3 bg-surfaceSoft rounded-xl p-3 flex items-center justify-center gap-2">
            <HeartIcon size={18} className="text-accent" />
            <p className="text-muted text-[10px] font-bold uppercase">平均心率：</p>
            <p className="text-base font-bold text-ink">{avgHeartRate} <span className="text-xs">次/分</span></p>
          </div>
        )}

        {!isTotal && (hovered || defaultExpanded) && (
          <Suspense fallback="加载中...">
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
