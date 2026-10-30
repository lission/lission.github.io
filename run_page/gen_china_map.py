"""Generate the province outlines used by the Footprint Map card.

Source: DataV.GeoAtlas (Alibaba Cloud) `areas_v3/bound/100000_full.json` -- the
mainland, Taiwan, Hong Kong, Macao and the South China Sea islands all come from
this one file, so the outlines stay consistent with the national standard instead
of being hand-drawn.

The mainland is drawn on its own (corner to corner, no empty ocean), while the
South China Sea islands -- together with the Hainan rings south of the crop line
-- go into a framed inset in the bottom-right corner.  That is how standard
Chinese maps show that area, and it stops the card from being mostly blank water.

Output is a tiny TypeScript module of SVG path strings (Web Mercator), so the
page never calls an external geo API at runtime:

    python run_page/gen_china_map.py --input 100000_full.json
    # writes src/static/china-provinces.ts
"""

import argparse
import json
import math
import os

VIEW_W = 800.0
PADDING = 6.0
# Douglas-Peucker tolerance in output units.  800 units spans the country, so
# 0.4 is roughly 2.5 km -- far below one screen pixel at any card size, and it
# drops ~65% of the source points.
EPSILON = 0.4
DECIMALS = 1
# Everything south of this latitude leaves the mainland map and moves into the
# inset (Hainan island itself ends at 18.15N).
CROP_LAT = 17.6
INSET_H = 150.0
INSET_MARGIN = 8.0


def project(lng: float, lat: float) -> tuple:
    """Web Mercator, the same projection echarts/leaflet use for country maps."""
    x = lng
    lat = max(min(lat, 85.0), -85.0)
    y = math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))
    return x, -y


def perpendicular_distance(pt, start, end) -> float:
    (px, py), (sx, sy), (ex, ey) = pt, start, end
    dx, dy = ex - sx, ey - sy
    if dx == 0 and dy == 0:
        return math.hypot(px - sx, py - sy)
    t = ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (sx + t * dx), py - (sy + t * dy))


def simplify(points, epsilon):
    """Douglas-Peucker, iterative so deep rings cannot blow the stack."""
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        if end <= start + 1:
            continue
        worst, worst_index = 0.0, -1
        for i in range(start + 1, end):
            d = perpendicular_distance(points[i], points[start], points[end])
            if d > worst:
                worst, worst_index = d, i
        if worst > epsilon and worst_index > 0:
            keep[worst_index] = True
            stack.append((start, worst_index))
            stack.append((worst_index, end))
    return [p for p, k in zip(points, keep) if k]


def rings_of(geometry):
    if not geometry:
        return []
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in geometry["coordinates"] for ring in polygon]
    return list(geometry["coordinates"])


def fmt(value: float) -> str:
    text = f"{value:.{DECIMALS}f}"
    return text[:-2] if text.endswith(".0") else text


def bbox_of(rings):
    xs = [pt[0] for ring in rings for pt in ring]
    ys = [pt[1] for ring in rings for pt in ring]
    return min(xs), min(ys), max(xs), max(ys)


def to_path(rings, transform, epsilon):
    parts = []
    for ring in rings:
        pts = simplify([transform(lng, lat) for lng, lat in ring], epsilon)
        if len(pts) < 3:
            continue
        closed = pts + [pts[0]]
        head = f"M{fmt(closed[0][0])},{fmt(closed[0][1])}"
        parts.append(head + "".join(f"L{fmt(x)},{fmt(y)}" for x, y in closed[1:]) + "Z")
    return "".join(parts)


def corners(geo_bbox):
    """Projected bbox corners, normalised so y grows downwards (SVG style)."""
    min_lng, min_lat, max_lng, max_lat = geo_bbox
    ax, ay = project(min_lng, min_lat)
    bx, by = project(max_lng, max_lat)
    return min(ax, bx), min(ay, by), max(ax, bx), max(ay, by)


class Fixture:
    """Projects a fixed lng/lat bbox into a fixed output box, aspect preserved."""

    def __init__(self, geo_bbox, out_box):
        self.x0, self.y0, x1, y1 = corners(geo_bbox)
        self.span_x, self.span_y = x1 - self.x0, y1 - self.y0
        self.box_x, self.box_y, self.box_w, self.box_h = out_box
        self.scale = min(self.box_w / self.span_x, self.box_h / self.span_y)
        self.pad_x = self.box_x + (self.box_w - self.span_x * self.scale) / 2
        self.pad_y = self.box_y + (self.box_h - self.span_y * self.scale) / 2

    def __call__(self, lng, lat):
        x, y = project(lng, lat)
        return (
            (x - self.x0) * self.scale + self.pad_x,
            (y - self.y0) * self.scale + self.pad_y,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="100000_full.json", help="GeoJSON source")
    parser.add_argument(
        "--output", default="src/static/china-provinces.ts", help="TypeScript module"
    )
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    provinces = []  # (name, rings kept on the mainland)
    south_sea_rings = []  # islands for the inset
    for feature in data["features"]:
        name = feature["properties"].get("name") or ""
        rings = rings_of(feature["geometry"])
        if not name:
            south_sea_rings.extend(rings)
            continue
        keep, move = [], []
        for ring in rings:
            _, min_lat, _, _ = bbox_of([ring])
            (move if min_lat < CROP_LAT else keep).append(ring)
        # Hainan's outlying islands belong in the inset, not clipped on the map
        south_sea_rings.extend(move)
        if keep:
            provinces.append((name, keep))

    mainland = bbox_of([ring for _, rings in provinces for ring in rings])
    main_w = VIEW_W - PADDING * 2
    sx0, sy0, sx1, sy1 = corners(mainland)
    height = main_w * (sy1 - sy0) / (sx1 - sx0) + PADDING * 2
    main_fixture = Fixture(mainland, (PADDING, PADDING, main_w, height - PADDING * 2))

    inset_bbox = bbox_of(south_sea_rings)
    ix0, iy0, ix1, iy1 = corners(inset_bbox)
    inset_w = INSET_H * (ix1 - ix0) / (iy1 - iy0)
    inset_box = (
        VIEW_W - PADDING - INSET_MARGIN - inset_w,
        height - PADDING - INSET_MARGIN - INSET_H,
        inset_w,
        INSET_H,
    )
    inset_fixture = Fixture(inset_bbox, inset_box)
    south_sea_path = to_path(south_sea_rings, inset_fixture, EPSILON)

    paths = [(name, to_path(rings, main_fixture, EPSILON)) for name, rings in provinces]
    paths = [(name, d) for name, d in paths if d]
    points = sum(d.count("L") + d.count("M") for _, d in paths)
    points += south_sea_path.count("L") + south_sea_path.count("M")

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write("// Generated by run_page/gen_china_map.py -- do not edit by hand.\n")
        f.write(
            "// Source: DataV.GeoAtlas (Alibaba Cloud) 100000_full.json, Web Mercator.\n"
        )
        f.write(
            "// Contract: run `python run_page/gen_china_map.py --input <geojson>`.\n\n"
        )
        f.write(f"export const CHINA_MAP_VIEWBOX = '0 0 {fmt(VIEW_W)} {fmt(height)}';\n\n")
        f.write("export interface ChinaProvince {\n  name: string;\n  d: string;\n}\n\n")
        f.write("export const CHINA_PROVINCES: ChinaProvince[] = [\n")
        for name, d in paths:
            f.write(f"  {{ name: '{name}', d: '{d}' }},\n")
        f.write("];\n\n")
        f.write("// South China Sea islands, drawn as a framed inset (standard practice\n")
        f.write("// for Chinese maps) so the mainland is not surrounded by empty water.\n")
        f.write("export const CHINA_SOUTH_SEA = {\n")
        f.write(f"  d: '{south_sea_path}',\n")
        f.write(
            "  box: {{ x: {}, y: {}, w: {}, h: {} }},\n".format(
                fmt(inset_box[0]),
                fmt(inset_box[1]),
                fmt(inset_box[2]),
                fmt(inset_box[3]),
            )
        )
        f.write("};\n")

    size = os.path.getsize(args.output)
    print(
        f"wrote {args.output}: {len(paths)} regions, {points} points, "
        f"viewBox 800x{height:.0f}, inset {inset_box[2]:.0f}x{inset_box[3]:.0f}, "
        f"{size / 1024:.0f} KB"
    )


if __name__ == "__main__":
    main()
