import useActivities from '@/hooks/useActivities';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { runPeriod } = useActivities();

  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);
  
  const getPeriodEmoji = (period: string) => {
    if (period.includes('清晨')) return '🌅';
    if (period.includes('午间')) return '☀️';
    if (period.includes('午后')) return '🌤️';
    if (period.includes('傍晚')) return '🌇';
    if (period.includes('夜晚')) return '🌙';
    if (period.includes('马拉松')) return '🏃';
    return '🏃‍♂️';
  };
  
  return (
    <div className="mb-6">
      <h4 className="font-sans text-lg font-bold text-ghibli-text mb-3 flex items-center gap-2">
        ⏰ 跑步时段
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {periodArr.map(([period, times]) => (
          <div
            key={period}
            className="ghibli-card p-3 shadow-sm cursor-pointer hover:shadow-ghibli"
            onClick={() => onClick(period)}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getPeriodEmoji(period)}</span>
              <div>
                <p className="font-semibold text-ghibli-text text-sm">{period}</p>
                <p className="text-xs text-ghibli-accent">{times} Runs</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeriodStat;
