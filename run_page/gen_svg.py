import argparse
import logging
import os
import sys

import appdirs
from config import SQL_FILE
from gpxtrackposter import (
    circular_drawer,
    github_drawer,
    grid_drawer,
    poster,
    track_loader,
)
from gpxtrackposter.exceptions import ParameterError, PosterError

# from flopp great repo
__app_name__ = "create_poster"
__app_author__ = "flopp.net"


def main():
    """Handle command line arguments and call other modules as needed."""

    p = poster.Poster()
    drawers = {
        "grid": grid_drawer.GridDrawer(p),
        "circular": circular_drawer.CircularDrawer(p),
        "github": github_drawer.GithubDrawer(p),
    }

    args_parser = argparse.ArgumentParser()
    args_parser.add_argument(
        "--gpx-dir",
        dest="gpx_dir",
        metavar="DIR",
        type=str,
        default=".",
        help="Directory containing GPX files (default: current directory).",
    )
    args_parser.add_argument(
        "--output",
        metavar="FILE",
        type=str,
        default="poster.svg",
        help='Name of generated SVG image file (default: "poster.svg").',
    )
    args_parser.add_argument(
        "--language",
        metavar="LANGUAGE",
        type=str,
        default="",
        help="Language (default: english).",
    )
    args_parser.add_argument(
        "--year",
        metavar="YEAR",
        type=str,
        default="all",
        help='Filter tracks by year; "NUM", "NUM-NUM", "all" (default: all years)',
    )
    args_parser.add_argument(
        "--title", metavar="TITLE", type=str, help="Title to display."
    )
    args_parser.add_argument(
        "--athlete",
        metavar="NAME",
        type=str,
        default="John Doe",
        help='Athlete name to display (default: "John Doe").',
    )
    args_parser.add_argument(
        "--special",
        metavar="FILE",
        action="append",
        default=[],
        help="Mark track file from the GPX directory as special; use multiple times to mark "
        "multiple tracks.",
    )
    types = '", "'.join(drawers.keys())
    args_parser.add_argument(
        "--type",
        metavar="TYPE",
        default="grid",
        choices=drawers.keys(),
        help=f'Type of poster to create (default: "grid", available: "{types}").',
    )
    args_parser.add_argument(
        "--background-color",
        dest="background_color",
        metavar="COLOR",
        type=str,
        default="none",
        help='Background color of poster (default: "none" = transparent).',
    )
    args_parser.add_argument(
        "--track-color",
        dest="track_color",
        metavar="COLOR",
        type=str,
        default="#2fb36d",
        help='Color of tracks (default: "#2fb36d", brand green = high intensity).',
    )
    args_parser.add_argument(
        "--track-color2",
        dest="track_color2",
        metavar="COLOR",
        type=str,
        default="#cdeedd",
        help="Secondary color of tracks (default: light mint = low intensity).",
    )
    args_parser.add_argument(
        "--text-color",
        dest="text_color",
        metavar="COLOR",
        type=str,
        default="#1c1c1e",
        help='Color of text (default: "#1c1c1e", ink).',
    )
    args_parser.add_argument(
        "--special-color",
        dest="special_color",
        metavar="COLOR",
        default="#157f47",
        help='Special track color (default: "#157f47", deep green).',
    )
    args_parser.add_argument(
        "--special-color2",
        dest="special_color2",
        metavar="COLOR",
        default="#0f6b3c",
        help="Secondary color of special tracks (default: #0f6b3c).",
    )
    args_parser.add_argument(
        "--empty-color",
        dest="empty_color",
        metavar="COLOR",
        default="#e9e9e4",
        help="Color of empty calendar cells (default: #e9e9e4).",
    )
    args_parser.add_argument(
        "--units",
        dest="units",
        metavar="UNITS",
        type=str,
        choices=["metric", "imperial"],
        default="metric",
        help='Distance units; "metric", "imperial" (default: "metric").',
    )
    args_parser.add_argument(
        "--verbose", dest="verbose", action="store_true", help="Verbose logging."
    )
    args_parser.add_argument("--logfile", dest="logfile", metavar="FILE", type=str)
    args_parser.add_argument(
        "--special-distance",
        dest="special_distance",
        metavar="DISTANCE",
        type=float,
        default=10.0,
        help="Special Distance1 by km and color with the special_color",
    )
    args_parser.add_argument(
        "--special-distance2",
        dest="special_distance2",
        metavar="DISTANCE",
        type=float,
        default=20.0,
        help="Special Distance2 by km and corlor with the special_color2",
    )
    args_parser.add_argument(
        "--min-distance",
        dest="min_distance",
        metavar="DISTANCE",
        type=float,
        default=1.0,
        help="min distance by km for track filter",
    )
    args_parser.add_argument(
        "--use-localtime",
        dest="use_localtime",
        action="store_true",
        help="Use utc time or local time",
    )

    args_parser.add_argument(
        "--from-db",
        dest="from_db",
        action="store_true",
        help="activities db file",
    )

    for _, drawer in drawers.items():
        drawer.create_args(args_parser)

    args = args_parser.parse_args()

    for _, drawer in drawers.items():
        drawer.fetch_args(args)

    log = logging.getLogger("gpxtrackposter")
    log.setLevel(logging.INFO if args.verbose else logging.ERROR)
    if args.logfile:
        handler = logging.FileHandler(args.logfile)
        log.addHandler(handler)

    loader = track_loader.TrackLoader()
    if args.use_localtime:
        loader.use_local_time = True
    if not loader.year_range.parse(args.year):
        raise ParameterError(f"Bad year range: {args.year}.")

    loader.special_file_names = args.special
    loader.min_length = args.min_distance * 1000

    if args.from_db:
        # for svg from db here if you want gpx please do not use --from-db
        # args.type == "grid" means have polyline data or not
        tracks = loader.load_tracks_from_db(SQL_FILE, args.type == "grid")
    else:
        tracks = loader.load_tracks(args.gpx_dir)
    if not tracks:
        return

    is_circular = args.type == "circular"

    if not is_circular:
        print(
            f"Creating poster of type {args.type} with {len(tracks)} tracks and storing it in file {args.output}..."
        )
    p.set_language(args.language)
    p.athlete = args.athlete
    if args.title:
        p.title = args.title
    else:
        p.title = p.trans("MY TRACKS")

    p.special_distance = {
        "special_distance": args.special_distance,
        "special_distance2": args.special_distance2,
    }

    p.colors = {
        "background": args.background_color,
        "track": args.track_color,
        "track2": args.track_color2 or args.track_color,
        "special": args.special_color,
        "special2": args.special_color2 or args.special_color,
        "text": args.text_color,
        "text_muted": "#6b6b70",
        "empty": args.empty_color,
    }
    p.units = args.units
    p.set_tracks(tracks)
    # circular not add footer and header; for the web embeds (github/grid) we also
    # drop the in-SVG header/footer since the React cards supply their own titles.
    p.drawer_type = "plain" if is_circular else "title"
    p.hide_chrome = not is_circular
    if args.type == "github":
        # Derive the canvas from the drawer's own block metrics: the old
        # `55 + 43 * years` left a header-sized blank strip under the calendar.
        p.height = drawers["github"].content_height(len(p.years.year_set))
    # for special circular
    if is_circular:
        years = p.years.all()[:]
        for y in years:
            p.years.from_year, p.years.to_year = y, y
            # may be refactor
            p.set_tracks(tracks)
            p.draw(drawers[args.type], os.path.join("assets", f"year_{str(y)}.svg"))
    else:
        p.draw(drawers[args.type], args.output)


if __name__ == "__main__":
    try:
        # generate svg
        main()
    except PosterError as e:
        print(e)
        sys.exit(1)
