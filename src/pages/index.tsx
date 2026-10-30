import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Layout from '@/components/Layout';
import FootprintMap from '@/components/FootprintMap';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import SVGStat from '@/components/SVGStat';
import YearNav from '@/components/YearNav';
import YearStat from '@/components/YearStat';
import LocationSummary from '@/components/LocationStat/LocationSummary';
import CitiesStat from '@/components/LocationStat/CitiesStat';
import PeriodStat from '@/components/LocationStat/PeriodStat';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { INFO_MESSAGE } from '@/utils/const';
import {
  Activity,
  IViewState,
  filterAndSortRuns,
  filterCityRuns,
  filterTitleRuns,
  filterYearRuns,
  geoJsonForRuns,
  getBoundsForGeoData,
  scrollToMap,
  sortDateFunc,
  titleForShow,
  RunIds,
} from '@/utils/utils';

const Index = () => {
  const { siteTitle } = useSiteMetadata();
  const { activities, thisYear, years } = useActivities();
  const [year, setYear] = useState(thisYear);
  const [runIndex, setRunIndex] = useState(-1);
  const [runs, setActivity] = useState(
    filterAndSortRuns(activities, year, filterYearRuns, sortDateFunc)
  );
  const [title, setTitle] = useState('');
  const [geoData, setGeoData] = useState(geoJsonForRuns(runs));
  const bounds = getBoundsForGeoData(geoData);
  const [intervalId, setIntervalId] = useState<number>();

  const [viewState, setViewState] = useState<IViewState>({
    ...bounds,
  });
  const [flyTarget, setFlyTarget] = useState<IViewState | null>(null);

  const changeByItem = (
    item: string,
    name: string,
    func: (_run: Activity, _value: string) => boolean
  ) => {
    scrollToMap();
    if (name != 'Year') {
      setYear(thisYear);
    }
    setActivity(filterAndSortRuns(activities, item, func, sortDateFunc));
    setRunIndex(-1);
    setTitle(`${item} ${name} Running Heatmap`);
  };

  // Restore the full set of routes for the current year on the map.
  // Triggered when re-selecting the already-active year (e.g. clicking the
  // "20xx Journey" overview card after drilling into a single Recent Pathways
  // row). One-shot geoData swap + smooth flyTo: no progressive redraw
  // animation and no hard viewState jump, so nothing flickers.
  const showFullYearRoutes = () => {
    const yearGeo = geoJsonForRuns(runs);
    setRunIndex(-1);
    setGeoData(yearGeo);
    setTitle(`${year} Year Running Heatmap`);
    setFlyTarget(getBoundsForGeoData(yearGeo));
  };

  const changeYear = (y: string) => {
    if (y === year) {
      showFullYearRoutes();
      return;
    }
    setYear(y);

    if ((viewState.zoom ?? 0) > 3 && bounds) {
      setViewState({
        ...bounds,
      });
    }

    changeByItem(y, 'Year', filterYearRuns);
    clearInterval(intervalId);
  };

  const changeCity = (city: string) => {
    changeByItem(city, 'City', filterCityRuns);
  };

  const changeTitle = (title: string) => {
    changeByItem(title, 'Title', filterTitleRuns);
  };

  const locateActivity = (runIds: RunIds) => {
    const ids = new Set(runIds);

    const selectedRuns = !runIds.length
      ? runs
      : runs.filter((r: any) => ids.has(r.run_id));

    if (!selectedRuns.length) {
      return;
    }

    const lastRun = selectedRuns.sort(sortDateFunc)[0];

    if (!lastRun) {
      return;
    }
    setGeoData(geoJsonForRuns(selectedRuns));
    setTitle(titleForShow(lastRun));
    clearInterval(intervalId);

    // Smoothly fly to the selected run (RunMap performs the animated flyTo).
    setFlyTarget(getBoundsForGeoData(geoJsonForRuns(selectedRuns)));
  };

  useEffect(() => {
    setViewState({
      ...getBoundsForGeoData(geoJsonForRuns(runs)),
    });
    const runsNum = runs.length;
    const sliceNume = runsNum >= 20 ? runsNum / 20 : 1;
    let i = sliceNume;
    const id = setInterval(() => {
      if (i >= runsNum) {
        clearInterval(id);
      }

      const tempRuns = runs.slice(0, i);
      setGeoData(geoJsonForRuns(tempRuns));
      i += sliceNume;
    }, 100);
    setIntervalId(id);
  }, [runs]);

  useEffect(() => {
    if (year !== 'Total') {
      return;
    }

    let svgStat = document.getElementById('svgStat');
    if (!svgStat) {
      return;
    }

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'path') {
        const descEl = target.querySelector('desc');
        if (descEl) {
          const runId = Number(descEl.innerHTML);
          if (!runId) {
            return;
          }
          locateActivity([runId]);
          return;
        }

        const titleEl = target.querySelector('title');
        if (titleEl) {
          const [runDate] = titleEl.innerHTML.match(
            /\d{4}-\d{1,2}-\d{1,2}/
          ) || [`${+thisYear + 1}`];
          const runIDsOnDate = runs
            .filter((r) => r.start_date_local.slice(0, 10) === runDate)
            .map((r) => r.run_id);
          if (!runIDsOnDate.length) {
            return;
          }
          locateActivity(runIDsOnDate);
        }
      }
    };
    svgStat.addEventListener('click', handleClick);
    return () => {
      svgStat && svgStat.removeEventListener('click', handleClick);
    };
  }, [year]);

  return (
    <Layout>
      <YearNav year={year} onClick={changeYear} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1">
          <section className="card p-4 shadow-sm mb-6">
            <div
              className="leading-relaxed text-ink"
              dangerouslySetInnerHTML={{ __html: INFO_MESSAGE(years.length, year) }}
            />
          </section>
          <LocationSummary />
          <CitiesStat onClick={changeCity} />
          <PeriodStat onClick={changeTitle} />
        </div>
        <div className="lg:col-span-2 flex min-w-0 flex-col gap-6">
          <div className="h-[300px] shrink-0 lg:h-[420px]">
            <FootprintMap />
          </div>
          <div className="min-h-[320px] flex-1 lg:min-h-[240px]">
            <RunMap
              title={title}
              viewState={viewState}
              geoData={geoData}
              setViewState={setViewState}
              changeYear={changeYear}
              thisYear={year}
              flyTarget={flyTarget}
            />
          </div>
        </div>
      </div>
      <div
        className={
          year === 'Total'
            ? 'mt-6'
            : 'mt-6 mx-auto w-full max-w-2xl flex flex-col items-center'
        }
      >
        <YearStat year={year} onClick={changeYear} defaultExpanded />
        {year !== 'Total' && (
          <RunTable
            runs={runs}
            locateActivity={locateActivity}
            setActivity={setActivity}
            runIndex={runIndex}
            setRunIndex={setRunIndex}
          />
        )}
      </div>
      {year === 'Total' && (
        <div className="mt-6">
          <SVGStat />
        </div>
      )}
      <Analytics />
    </Layout>
  );
};

export default Index;
