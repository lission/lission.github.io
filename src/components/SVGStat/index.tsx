import { lazy, Suspense } from 'react';
import { totalStat } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';

const GithubSvg = lazy(() => loadSvgComponent(totalStat, './github.svg'));
const GridSvg = lazy(() => loadSvgComponent(totalStat, './grid.svg'));

const SVGStat = () => (
  <div id="svgStat" className="mt-6">
    <div className="ghibli-card p-4 shadow-sm mb-4">
      <h4 className="font-sans text-xl font-bold text-ghibli-text mb-4 flex items-center gap-2">
        📅 Running Calendar
      </h4>
      <Suspense fallback={<div className="text-center text-ghibli-tan">Loading...</div>}>
        <GithubSvg className="h-auto w-full" />
      </Suspense>
    </div>
    <div className="ghibli-card p-4 shadow-sm">
      <h4 className="font-sans text-xl font-bold text-ghibli-text mb-4 flex items-center gap-2">
        🗺️ Route Grid
      </h4>
      <Suspense fallback={<div className="text-center text-ghibli-tan">Loading...</div>}>
        <GridSvg className="h-auto w-full" />
      </Suspense>
    </div>
  </div>
);

export default SVGStat;
