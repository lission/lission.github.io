import { useMemo, useState } from 'react';
import useActivities from '@/hooks/useActivities';
import { FootprintsIcon } from '@/components/icons';
import {
  CHINA_MAP_VIEWBOX,
  CHINA_PROVINCES,
  CHINA_SOUTH_SEA,
} from '@/static/china-provinces';

type HoveredProvince = { name: string; runs: number; distance: number };

/**
 * Province-level footprint map: every province the runs have reached is filled
 * with the brand green, the rest stay quiet grey.  Geometry comes from a
 * vendored DataV.GeoAtlas extract (see run_page/gen_china_map.py) so the card
 * needs no network request and the borders -- Taiwan, Hainan, the South China
 * Sea islands included -- stay consistent with the national standard.
 *
 * Hovering a province reports its run count and mileage in the bottom-left
 * corner of the card, the way run.xcouture.cc does it.  The readout sits in the
 * empty sea area so it never covers the landmass, and it keeps a fixed height
 * so the map does not shift when the text changes.
 */
const FootprintMap = () => {
  const { provinces, provinceDistance, provinceRuns } = useActivities();
  const [hovered, setHovered] = useState<HoveredProvince | null>(null);

  const visited = useMemo(() => new Set(provinces), [provinces]);
  const total = CHINA_PROVINCES.length;

  // Hover is the desktop gesture; tapping a province does the same on phones,
  // where there is no pointer to rest on the map.
  const showProvince = (name: string) =>
    setHovered({
      name,
      runs: provinceRuns[name] ?? 0,
      distance: provinceDistance[name] ?? 0,
    });

  return (
    <section className="card flex h-full flex-col overflow-hidden shadow-sm">
      {/* White header, matching the recent-runs card beside/below. */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h4 className="flex items-center gap-2 font-sans text-xl font-bold text-ink">
          <FootprintsIcon size={20} className="text-accentInk" />
          足迹地图
        </h4>
        <p className="text-sm text-muted">
          <span className="text-xl font-bold text-ink">{visited.size}</span>
          <span className="mx-1 text-line">/</span>
          {total} 省份
        </p>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <svg
          viewBox={CHINA_MAP_VIEWBOX}
          className="footprint-map h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`中国跑步足迹地图，已跑 ${visited.size} 个省份`}
          onMouseLeave={() => setHovered(null)}
        >
          {CHINA_PROVINCES.map((province) => {
            const isVisited = visited.has(province.name);
            return (
              <path
                key={province.name}
                d={province.d}
                className={isVisited ? 'is-visited' : 'is-empty'}
                strokeLinejoin="round"
                onMouseEnter={() => showProvince(province.name)}
                onClick={() => showProvince(province.name)}
              />
            );
          })}
          {/* South China Sea islands: framed inset, the way standard Chinese
              maps carry that area without blanking the mainland with open sea. */}
          <g className="footprint-map-inset">
            <rect
              x={CHINA_SOUTH_SEA.box.x}
              y={CHINA_SOUTH_SEA.box.y}
              width={CHINA_SOUTH_SEA.box.w}
              height={CHINA_SOUTH_SEA.box.h}
              strokeWidth="1"
              rx="3"
              style={{ fill: 'var(--surface)', stroke: 'var(--line)' }}
            />
            <path d={CHINA_SOUTH_SEA.d} />
            <text
              x={CHINA_SOUTH_SEA.box.x + CHINA_SOUTH_SEA.box.w / 2}
              y={CHINA_SOUTH_SEA.box.y + CHINA_SOUTH_SEA.box.h - 5}
              textAnchor="middle"
              fontSize="13"
              style={{ fill: 'var(--muted)' }}
            >
              南海诸岛
            </text>
          </g>
        </svg>

        {/* Hover readout: bottom-left, over the open sea, never over the land. */}
        <div
          className="pointer-events-none absolute bottom-4 left-4 min-h-[28px] text-sm"
          aria-live="polite"
        >
          {hovered && (
            <p className="flex items-baseline gap-2 leading-none">
              <span className="font-bold text-ink">{hovered.name}</span>
              {hovered.runs > 0 ? (
                <>
                  <span className="font-semibold text-accentInk">
                    {hovered.runs} 次
                  </span>
                  <span className="text-muted">
                    {`${(hovered.distance / 1000).toFixed(1)} 公里`}
                  </span>
                </>
              ) : (
                <span className="text-muted">尚未踏足</span>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default FootprintMap;
