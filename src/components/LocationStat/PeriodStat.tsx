import useActivities from '@/hooks/useActivities';
import {
  SunriseIcon,
  SunIcon,
  CloudSunIcon,
  SunsetIcon,
  MoonIcon,
  FootprintsIcon,
  ClockIcon,
} from '@/components/icons';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { runPeriod } = useActivities();

  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);

  const getPeriodIcon = (period: string) => {
    if (period.includes('清晨')) return <SunriseIcon size={16} className="text-muted" />;
    if (period.includes('午间')) return <SunIcon size={16} className="text-muted" />;
    if (period.includes('午后')) return <CloudSunIcon size={16} className="text-muted" />;
    if (period.includes('傍晚')) return <SunsetIcon size={16} className="text-muted" />;
    if (period.includes('夜晚')) return <MoonIcon size={16} className="text-muted" />;
    return <FootprintsIcon size={16} className="text-muted" />;
  };

  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ink mb-3 flex items-center gap-2">
        <ClockIcon size={18} className="text-ink" />
        跑步时段
      </h4>
      <div className="flex flex-wrap gap-2">
        {periodArr.map(([period, times]) => (
          <button
            key={period}
            onClick={() => onClick(period)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink transition-all duration-200 hover:border-accent/40 hover:text-accentInk"
          >
            {getPeriodIcon(period)}
            <span>{period}</span>
            <span className="text-xs text-accentInk">{times}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodStat;
