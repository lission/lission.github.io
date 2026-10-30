import { lazy, Suspense } from 'react';
import { totalStat } from '@assets/index';
import { loadSvgComponent } from '@/utils/svgUtils';
import { CalendarIcon, MapIcon } from '@/components/icons';

const GithubSvg = lazy(() => loadSvgComponent(totalStat, './github.svg'));
const GridSvg = lazy(() => loadSvgComponent(totalStat, './grid.svg'));

const SVGStat = () => (
    <div id="svgStat" className="mt-6 grid grid-cols-1 gap-4">
      <div className="card p-4 shadow-sm calChart w-full">
      <h4 className="font-sans text-xl font-bold text-ink mb-4 flex items-center gap-2">
        <CalendarIcon size={20} className="text-ink" />
        Running Calendar
      </h4>
      <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
        <GithubSvg className="h-auto w-full" />
      </Suspense>
    </div>
    <div className="card p-4 shadow-sm gridChart w-full">
      <h4 className="font-sans text-xl font-bold text-ink mb-4 flex items-center gap-2">
        <MapIcon size={20} className="text-ink" />
        Route Grid
      </h4>
      <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
        <GridSvg className="h-auto w-full" />
      </Suspense>
    </div>
  </div>
);

export default SVGStat;
