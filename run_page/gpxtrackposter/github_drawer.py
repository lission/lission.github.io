import calendar
import datetime
import locale

import svgwrite

from .exceptions import PosterError
from .poster import Poster, FONT
from .tracks_drawer import TracksDrawer
from .utils import format_float
from .xy import XY


YEAR_SIZE = 200 * 4.0 / 80.0  # height of the "2024" year label, in poster units
MONTH_SIZE = 2.5
DAY_SIZE = 2.6  # calendar cell edge
DAY_STEP = 3.5  # vertical / horizontal pitch between cells
DAYS_PER_WEEK = 7
WEEKS = 54
# One year block: year label + month labels + 7 rows of cells.
BLOCK_STEP = DAY_STEP * 9 + YEAR_SIZE + 1.0
# Distance from a block's top to the bottom edge of its last cell row.
BLOCK_CONTENT_HEIGHT = YEAR_SIZE + 2 + DAY_STEP * DAYS_PER_WEEK + DAY_SIZE
BOTTOM_PADDING = 2.0


class GithubDrawer(TracksDrawer):
    """Draw a gtihub profile-like poster"""

    def __init__(self, the_poster: Poster):
        super().__init__(the_poster)

    @staticmethod
    def content_height(year_count: int) -> float:
        """Canvas height that exactly fits `year_count` calendar blocks.

        The old caller used `55 + 43 * years`, which is close to a block's pitch
        (42.5) but leaves a header-sized gap under the last row -- that dead
        space is what showed up under the calendar on the page.
        """
        if year_count <= 0:
            return BLOCK_STEP
        return BLOCK_STEP * (year_count - 1) + BLOCK_CONTENT_HEIGHT + BOTTOM_PADDING

    def draw(self, dr: svgwrite.Drawing, size: XY, offset: XY):
        if self.poster.tracks is None:
            raise PosterError("No tracks to draw")
        year_size = YEAR_SIZE
        year_style = f"font-size:{year_size}px; font-family:{FONT}; font-weight:600;"
        year_length_style = f"font-size:{110 * 3.0 / 80.0}px; font-family:{FONT}; font-weight:600;"
        month_names_style = f"font-size:{MONTH_SIZE}px; font-family:{FONT};"
        total_length_year_dict = self.poster.total_length_year_dict

        # 将set转换为list
        year_list = list(self.poster.years.year_set)
        # 对list进行排序（默认为升序）
        year_list.sort(reverse=True)
        # 使用for循环遍历年份
        for year in year_list:
            # for year in range(self.poster.years.from_year, self.poster.years.to_year + 1)[
            #     ::-1
            # ]:
            start_date_weekday, _ = calendar.monthrange(year, 1)
            github_rect_first_day = datetime.date(year, 1, 1)
            # Github profile the first day start from the last Monday of the last year or the first Monday of this year
            # It depands on if the first day of this year is Monday or not.
            github_rect_day = github_rect_first_day + datetime.timedelta(
                -start_date_weekday
            )
            year_length = total_length_year_dict.get(year, 0)
            year_length = format_float(self.poster.m2u(year_length))
            try:
                month_names = [
                    locale.nl_langinfo(day)[:3]  # Get only first three letters
                    for day in [
                        locale.MON_1,
                        locale.MON_2,
                        locale.MON_3,
                        locale.MON_4,
                        locale.MON_5,
                        locale.MON_6,
                        locale.MON_7,
                        locale.MON_8,
                        locale.MON_9,
                        locale.MON_10,
                        locale.MON_11,
                        locale.MON_12,
                    ]
                ]
                # support windows or others doesn't support locale Name, by Hard code
            except Exception as e:
                print(str(e))
                month_names = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                ]
            km_or_mi = "mi"
            if self.poster.units == "metric":
                km_or_mi = "km"
            dr.add(
                dr.text(
                    f"{year}",
                    insert=offset.tuple(),
                    fill=self.poster.colors["text"],
                    dominant_baseline="hanging",
                    style=year_style,
                )
            )

            dr.add(
                dr.text(
                    f"{year_length} {km_or_mi}",
                    insert=(offset.tuple()[0] + 165, offset.tuple()[1] + 5),
                    fill=self.poster.colors["text"],
                    dominant_baseline="hanging",
                    style=year_length_style,
                )
            )
            # add month name up to the poster one by one because of svg text auto trim the spaces.
            for num, name in enumerate(month_names):
                dr.add(
                    dr.text(
                        f"{name}",
                        insert=(offset.tuple()[0] + 15.5 * num, offset.tuple()[1] + 14),
                        fill=self.poster.colors["text_muted"],
                        style=month_names_style,
                    )
                )

            rect_x = 10.0
            dom = (DAY_SIZE, DAY_SIZE)
            # add every day of this year for 54 weeks and per week has 7 days
            for i in range(WEEKS):
                rect_y = offset.y + year_size + 2
                for j in range(DAYS_PER_WEEK):
                    if int(github_rect_day.year) > year:
                        break
                    rect_y += DAY_STEP
                    color = self.poster.colors.get("empty", "#e9e9e4")
                    date_title = str(github_rect_day)
                    if date_title in self.poster.tracks_by_date:
                        tracks = self.poster.tracks_by_date[date_title]
                        length = sum([t.length for t in tracks])
                        distance1 = self.poster.special_distance["special_distance"]
                        distance2 = self.poster.special_distance["special_distance2"]
                        has_special = distance1 < length / 1000 < distance2
                        color = self.color(
                            self.poster.length_range_by_date, length, has_special
                        )
                        if length / 1000 >= distance2:
                            color = self.poster.colors.get(
                                "special2"
                            ) or self.poster.colors.get("special")
                        str_length = format_float(self.poster.m2u(length))
                        date_title = f"{date_title} {str_length} {km_or_mi}"

                    rect = dr.rect((rect_x, rect_y), dom, fill=color, rx=0.7, ry=0.7)
                    rect.set_desc(title=date_title)
                    dr.add(rect)
                    github_rect_day += datetime.timedelta(1)
                rect_x += DAY_STEP
            offset.y += BLOCK_STEP
