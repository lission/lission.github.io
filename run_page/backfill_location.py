"""Backfill missing `location_country` for activities already stored in the DB.

Why this exists
---------------
The Coros/FIT sync path produces activities whose `location_country` is empty
and `db.update_or_create_activity` only tries reverse geocoding *once*, at
insert time.  When that call fails (Nominatim rejects the random 4-letter user
agent / rate limits a burst of a few hundred requests) the exception is
swallowed and the empty string is stored forever -- the update branch never
retries.  Such runs cannot be assigned to any city, so the site's "城市足迹"
undercounts badly (e.g. Dali showing 46 km out of 3371 km).

What this does
--------------
Fills those holes fully offline: every run that already has a location acts as
an anchor, and any run whose track starts within `--radius` metres of an anchor
inherits that anchor's location string.  Anchors are re-evaluated each round so
a run filled in round 1 can anchor others in round 2.  No network access, no
API keys, results are deterministic and reproducible.

The default 50 km radius is deliberately generous: city statistics are counted
per prefecture-level city, and 50 km around the dense home-area anchors stays
inside one prefecture while still being far shorter than the gap to the next
city (the nearest foreign-city runs in this repo sit 68 km+ away).  Runs that
are genuinely far from every anchor (a race in another city) are left untouched
on purpose -- a wrong city is worse than no city -- and are handled instead by
the hand-curated `MANUAL_LOCATIONS` table, which wins over the radius logic.
The frontend still reports any remainder explicitly.

Usage
-----
    python run_page/backfill_location.py            # fill + patch json
    python run_page/backfill_location.py --dry-run  # report only, no writes
"""

import argparse
import json
import math
import os
import sqlite3
import sys

# Resolve paths locally instead of importing config, so this script runs with a
# bare standard library (no pyyaml / sqlalchemy / stravalib needed to backfill).
RUN_PAGE_DIR = os.path.dirname(os.path.realpath(__file__))
REPO_ROOT = os.path.dirname(RUN_PAGE_DIR)
SQL_FILE = os.path.join(RUN_PAGE_DIR, "data.db")
JSON_FILE = os.path.join(REPO_ROOT, "src", "static", "activities.json")

DEFAULT_RADIUS = 50000
DEFAULT_ROUNDS = 3

# Runs the anchor pass cannot reach, verified by hand.  They are kept out of the
# automatic radius logic on purpose:
#   * 2024-05-27 .. 06-11 (9 runs) -- every track starts at 39.9123, 116.1751,
#     i.e. one fixed loop inside Beijing, far from any Dali anchor.
#   * 2017-09-02 / 2018-03-29 (2 codoon runs) -- the source file has no track at
#     all, but the adjacent records on 09-01, 09-04 and 03-22, 04-08 are the
#     same 5 km / 3.9 km routine loop at 中国电影博物馆, 朝阳区, 北京市, and the
#     distances match, so the city is certain even though the street is not.
#   * the Yunnan trips below -- reverse geocoded from the first track point once
#     each; they are 200 km+ from every anchor so the radius pass never reaches
#     them.  Kept ascending (street, county, prefecture, province, country) and
#     simplified Chinese, because `locationForRun()` matches the prefecture
#     names in `src/static/city.ts`.
MANUAL_LOCATIONS = {
    279164274: "北京市, 中国",
    285913496: "北京市, 中国",
    1716845637000: "北京市, 中国",
    1717018463000: "北京市, 中国",
    1717277962000: "北京市, 中国",
    1717450378000: "北京市, 中国",
    1717537149000: "北京市, 中国",
    1717708993000: "北京市, 中国",
    1717881701000: "北京市, 中国",
    1718054481000: "北京市, 中国",
    1718140934000: "北京市, 中国",
    # 腾冲 · 腾越街道
    1731803450000: "腾越街道, 腾冲市, 保山市, 云南省, 中国",
    # 泸沽湖 · 宁蒗（两跑同一地点）
    1756075957000: "宁蒗彝族自治县, 丽江市, 云南省, 中国",
    1756160291000: "宁蒗彝族自治县, 丽江市, 云南省, 中国",
    # 昆明滇池 · 42 km 全马
    1764460976000: "昆明滇池国家旅游度假区, 西山区, 昆明市, 云南省, 中国",
    # 昆明大板桥（两跑同一地点）
    1768909952000: "大板桥街道, 官渡区, 昆明市, 云南省, 中国",
    1769086770000: "大板桥街道, 官渡区, 昆明市, 云南省, 中国",
    # 曲靖麒麟区 / 会泽县
    1769947634000: "南宁街道, 麒麟区, 曲靖市, 云南省, 中国",
    1770296373000: "会泽县, 曲靖市, 云南省, 中国",
    # 西双版纳景洪 / 普洱镇沅
    1777762107000: "景洪市, 西双版纳傣族自治州, 云南省, 中国",
    1777933809000: "恩乐镇, 镇沅彝族哈尼族拉祜族自治县, 普洱市, 云南省, 中国",
}


def decode_first_point(encoded):
    """Decode the first coordinate of a Google encoded polyline."""
    if not encoded:
        return None
    try:
        index = 0
        values = []
        for _ in range(2):
            shift = 0
            result = 0
            while True:
                chunk = ord(encoded[index]) - 63
                index += 1
                result |= (chunk & 0x1F) << shift
                shift += 5
                if chunk < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else (result >> 1)
            values.append(delta)
        return values[0] / 1e5, values[1] / 1e5
    except (IndexError, ValueError):
        return None


def haversine(a, b):
    """Great-circle distance in metres."""
    radius = 6371000
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(min(1.0, h)))


def find_nearest(point, anchors, radius):
    """Return the location of the closest anchor within `radius`, else None."""
    best = None
    best_distance = radius
    for anchor_point, anchor_location in anchors:
        distance = haversine(point, anchor_point)
        if distance <= best_distance:
            best = anchor_location
            best_distance = distance
    return best


def backfill(db_path, radius, rounds, dry_run=False):
    if not os.path.exists(db_path):
        # Never fail the sync job over a missing cache: there is nothing to fix.
        print(f"skip: database not found at {db_path}")
        return {}, []

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT run_id, location_country, summary_polyline FROM activities"
    ).fetchall()

    points = {
        row["run_id"]: decode_first_point(row["summary_polyline"]) for row in rows
    }
    locations = {row["run_id"]: (row["location_country"] or "").strip() for row in rows}

    missing = [run_id for run_id, loc in locations.items() if not loc]
    undecodable = [run_id for run_id in missing if not points[run_id]]
    candidates = [run_id for run_id in missing if points[run_id]]

    print(f"activities: {len(rows)}  with location: {len(rows) - len(missing)}")
    print(
        f"missing location: {len(missing)}  "
        f"(undecodable track start: {len(undecodable)})"
    )

    filled = {}
    manual = {}
    for run_id in missing:
        override = MANUAL_LOCATIONS.get(int(run_id))
        if override:
            manual[run_id] = override
    if manual:
        locations.update(manual)
        filled.update(manual)
        print(f"manual: filled {len(manual)} runs from the override table")

    for round_index in range(1, rounds + 1):
        anchors = [
            (points[run_id], loc)
            for run_id, loc in locations.items()
            if loc and points[run_id]
        ]
        newly_filled = {}
        for run_id in candidates:
            if locations[run_id]:
                continue
            hit = find_nearest(points[run_id], anchors, radius)
            if hit:
                newly_filled[run_id] = hit
        if not newly_filled:
            print(f"round {round_index}: nothing new, stop")
            break
        locations.update(newly_filled)
        filled.update(newly_filled)
        print(
            f"round {round_index}: filled {len(newly_filled)} runs "
            f"from {len(anchors)} anchors"
        )

    still_missing = [run_id for run_id in missing if not locations[run_id]]
    print(
        f"result: filled {len(filled)} / {len(missing)}; "
        f"still missing {len(still_missing)}"
    )

    if filled and not dry_run:
        conn.executemany(
            "UPDATE activities SET location_country = ? WHERE run_id = ?",
            [(location, run_id) for run_id, location in filled.items()],
        )
        conn.commit()
        print(f"database updated: {db_path}")
    elif filled:
        print("dry run: database untouched")
    conn.close()
    return filled, still_missing


def patch_json(json_path, locations):
    """Write the filled locations into an already generated activities.json.

    The JSON is produced by the sync script right before this runs, so only the
    `location_country` field needs patching -- every other field stays exactly
    as the sync wrote it.
    """
    if not os.path.exists(json_path):
        print(f"skip json patch (missing {json_path})")
        return 0

    with open(json_path, encoding="utf-8") as handle:
        activities = json.load(handle)

    # run_id is an int in both the DB and the JSON, but compare by string so a
    # sync script that serialises it as a string still matches.
    by_id = {str(run_id): location for run_id, location in locations.items()}

    patched = 0
    for activity in activities:
        new_location = by_id.get(str(activity.get("run_id")))
        if new_location and not (activity.get("location_country") or "").strip():
            activity["location_country"] = new_location
            patched += 1

    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(activities, handle)
    print(f"patched {patched} activities -> {json_path}")
    return patched


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=SQL_FILE, help="path to data.db")
    parser.add_argument("--json", default=JSON_FILE, help="path to activities.json")
    parser.add_argument(
        "--radius",
        type=int,
        default=DEFAULT_RADIUS,
        help="inherit a location when the track starts within this many metres",
    )
    parser.add_argument("--rounds", type=int, default=DEFAULT_ROUNDS)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--no-json", action="store_true", help="only touch the db, keep activities.json"
    )
    options = parser.parse_args()

    if not options.dry_run:
        filled, _ = backfill(options.db, options.radius, options.rounds)
    else:
        backfill(options.db, options.radius, options.rounds, dry_run=True)
        return 0

    if filled and not options.no_json:
        patch_json(options.json, filled)
    return 0


if __name__ == "__main__":
    sys.exit(main())
