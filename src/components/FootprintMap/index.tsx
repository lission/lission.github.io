import { useMemo } from 'react';
import useActivities from '@/hooks/useActivities';
import { FootprintsIcon } from '@/components/icons';
import {
  CHINA_MAP_VIEWBOX,
  CHINA_PROVINCES,
  CHINA_SOUTH_SEA,
} from '@/static/china-provinces';

/**
 * Province-level footprint map: every province the runs have reached is filled
 * with the brand green, the rest stay quiet grey.  Geometry comes from a
 * vendored DataV.GeoAtlas extract (see run_page/gen_china_map.py) so the card
 * needs no network request and the borders -- Taiwan, Hainan, the South China
 * Sea islands included -- stay consistent with the national standard.
 */
const FootprintMap = () => {
  const { provinces, provinceDistance } = useActivities();

  const visited = useMemo(() => new Set(provinces), [provinces]);
  const total = CHINA_PROVINCES.length;

  return (
    <section className="card flex h-full flex-col p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-sans text-lg font-bold text-ink flex items-center gap-2">
          <FootprintsIcon size={20} className="text-ink" />
          足迹地图
        </h4>
        <p className="text-sm text-muted">
          <span className="text-xl font-bold text-accentInk">{visited.size}</span>
          <span className="mx-1">/</span>
          {total} 省份
        </p>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 items-center justify-center">
        <svg
          viewBox={CHINA_MAP_VIEWBOX}
          className="footprint-map h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`中国跑步足迹地图，已跑 ${visited.size} 个省份`}
        >
          {CHINA_PROVINCES.map((province) => {
            const isVisited = visited.has(province.name);
            const distance = provinceDistance[province.name];
            return (
              <path
                key={province.name}
                d={province.d}
                className={isVisited ? 'is-visited' : 'is-empty'}
                strokeLinejoin="round"
              >
                <title>
                  {isVisited && distance
                    ? `${province.name} · ${(distance / 1000).toFixed(0)} km`
                    : province.name}
                </title>
              </path>
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
              fill="#fbfbfa"
              stroke="#e2e2dd"
              strokeWidth="1"
              rx="3"
            />
            <path d={CHINA_SOUTH_SEA.d}>
              <title>南海诸岛</title>
            </path>
            <text
              x={CHINA_SOUTH_SEA.box.x + CHINA_SOUTH_SEA.box.w / 2}
              y={CHINA_SOUTH_SEA.box.y + CHINA_SOUTH_SEA.box.h - 5}
              textAnchor="middle"
              fill="#6b6b70"
              fontSize="13"
            >
              南海诸岛
            </text>
          </g>
        </svg>
      </div>
    </section>
  );
};

export default FootprintMap;
