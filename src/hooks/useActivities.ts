import { locationForRun, titleForRun } from '@/utils/utils';
import activities from '@/static/activities.json';

const useActivities = () => {
  const cities: Record<string, number> = {};
  const runPeriod: Record<string, number> = {};
  const provinces: Set<string> = new Set();
  const provinceDistance: Record<string, number> = {};
  const countries: Set<string> = new Set();
  let years: Set<string> = new Set();
  let thisYear = '';
  // Runs whose `location_country` is empty (e.g. FIT/Coros sync without a
  // reverse-geocoded place). They belong to no city, so track them separately
  // instead of silently dropping them from the city totals.
  let unlocatedRuns = 0;
  let unlocatedDistance = 0;

  activities.forEach((run) => {
    const location = locationForRun(run);

    const periodName = titleForRun(run);
    if (periodName) {
      runPeriod[periodName] = runPeriod[periodName]
        ? runPeriod[periodName] + 1
        : 1;
    }

    const { city, province, country } = location;
    // drop only one char city
    if (city.length > 1) {
      cities[city] = cities[city] ? cities[city] + run.distance : run.distance;
    } else {
      unlocatedRuns += 1;
      unlocatedDistance += run.distance;
    }
    if (province) {
      provinces.add(province);
      provinceDistance[province] = provinceDistance[province]
        ? provinceDistance[province] + run.distance
        : run.distance;
    }
    if (country) countries.add(country);
    const year = run.start_date_local.slice(0, 4);
    years.add(year);
  });

  let yearsArray = [...years].sort().reverse();
  if (years) [thisYear] = yearsArray; // set current year as first one of years array

  return {
    activities,
    years: yearsArray,
    countries: [...countries],
    provinces: [...provinces],
    provinceDistance,
    cities,
    unlocatedRuns,
    unlocatedDistance,
    runPeriod,
    thisYear,
  };
};

export default useActivities;
