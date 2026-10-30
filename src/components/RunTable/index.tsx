import React, { useEffect, useState } from 'react';
import {
  sortDateFunc,
  sortDateFuncReverse,
  convertMovingTime2Sec,
  Activity,
  RunIds,
} from '@/utils/utils';
import { ChevronLeftIcon, ChevronRightIcon, RouteIcon } from '@/components/icons';
import RunRow from './RunRow';
import styles from './style.module.css';

interface IRunTableProperties {
  runs: Activity[];
  locateActivity: (_runIds: RunIds) => void;
  setActivity: (_runs: Activity[]) => void;
  runIndex: number;
  setRunIndex: (_index: number) => void;
}

type SortFunc = (_a: Activity, _b: Activity) => number;

// A year holds anywhere between a handful and a few hundred runs, and the table
// sits next to the fixed-height journey card.  Paging keeps the card height
// predictable instead of letting it grow with the data.
const PAGE_SIZE = 8;

const RunTable = ({
  runs,
  locateActivity,
  setActivity,
  runIndex,
  setRunIndex,
}: IRunTableProperties) => {
  const [sortFuncInfo, setSortFuncInfo] = useState('');
  const [page, setPage] = useState(0);

  // Switching year hands over a different array; start from the first page.
  useEffect(() => {
    setPage(0);
  }, [runs]);

  const sortKMFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'KM' ? a.distance - b.distance : b.distance - a.distance;
  const sortPaceFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Pace'
      ? a.average_speed - b.average_speed
      : b.average_speed - a.average_speed;
  const sortBPMFunc: SortFunc = (a, b) => {
    return sortFuncInfo === 'BPM'
      ? (a.average_heartrate ?? 0) - (b.average_heartrate ?? 0)
      : (b.average_heartrate ?? 0) - (a.average_heartrate ?? 0);
  };
  const sortRunTimeFunc: SortFunc = (a, b) => {
    const aTotalSeconds = convertMovingTime2Sec(a.moving_time);
    const bTotalSeconds = convertMovingTime2Sec(b.moving_time);
    return sortFuncInfo === 'Time'
      ? aTotalSeconds - bTotalSeconds
      : bTotalSeconds - aTotalSeconds;
  };
  const sortDateFuncClick =
    sortFuncInfo === 'Date' ? sortDateFunc : sortDateFuncReverse;
  const sortFuncMap = new Map([
    ['KM', sortKMFunc],
    ['Pace', sortPaceFunc],
    ['BPM', sortBPMFunc],
    ['Time', sortRunTimeFunc],
    ['Date', sortDateFuncClick],
  ]);
  // Display labels for the column headers. The internal sort keys above stay
  // English (the sort logic and click handler rely on them); only the visible
  // text is localized.
  const HEADER_LABELS: Record<string, string> = {
    KM: '公里',
    Pace: '配速',
    BPM: '心率',
    Time: '时长',
    Date: '日期',
  };

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    const funcName = (e.currentTarget as HTMLElement).dataset.sortkey;
    if (!funcName) return;
    const f = sortFuncMap.get(funcName);

    setRunIndex(-1);
    setPage(0);
    setSortFuncInfo(sortFuncInfo === funcName ? '' : funcName);
    setActivity(runs.sort(f));
  };

  const pageCount = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  // Guard against a stale page when the run list shrinks under it.
  const currentPage = Math.min(page, pageCount - 1);
  const startIndex = currentPage * PAGE_SIZE;
  const pagedRuns = runs.slice(startIndex, startIndex + PAGE_SIZE);

  const pagerButtonClass =
    'inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink transition-colors ' +
    'hover:border-accent/40 hover:text-accentInk disabled:cursor-not-allowed disabled:opacity-30 ' +
    'disabled:hover:border-line disabled:hover:text-ink';

  return (
    <div className={styles.tableContainer}>
      <div className="card flex h-full flex-col overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <RouteIcon size={20} className="text-accentInk" />
          <h3 className="font-sans text-xl font-bold text-ink">最近跑步记录</h3>
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className={`${styles.runTable} h-full`} cellSpacing="0" cellPadding="0">
            <thead>
              <tr>
                <th className={styles.nameHeader}>名称</th>
                {Array.from(sortFuncMap.keys()).map((k) => (
                  <th
                    key={k}
                    data-sortkey={k}
                    onClick={handleClick}
                    className={[
                      k === 'Date' ? styles.dateCol : '',
                      k === 'Time' || k === 'Date' ? styles.centerHeader : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {HEADER_LABELS[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRuns.map((run, offset) => (
                <RunRow
                  key={run.run_id}
                  elementIndex={startIndex + offset}
                  locateActivity={locateActivity}
                  run={run}
                  runIndex={runIndex}
                  setRunIndex={setRunIndex}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-3 py-2">
          <p className="text-xs text-muted">
            共 <span className="font-semibold text-ink">{runs.length}</span> 条
            <span className="mx-1.5 text-line">·</span>
            第 <span className="font-semibold text-ink">{currentPage + 1}</span> /{' '}
            {pageCount} 页
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="上一页"
              className={pagerButtonClass}
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              aria-label="下一页"
              className={pagerButtonClass}
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunTable;
