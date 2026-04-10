import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { INFO_MESSAGE } from '@/utils/const';

const YearsStat = ({ year, onClick }: { year: string, onClick: (_year: string) => void }) => {
  const { years } = useActivities();
  let yearsArrayUpdate = years.slice();
  yearsArrayUpdate.push('Total');
  yearsArrayUpdate = yearsArrayUpdate.filter((x) => x !== year);
  yearsArrayUpdate.unshift(year);

  return (
    <div className="w-full pb-8">
      <section className="mb-6">
        <div className="ghibli-card p-4 shadow-sm">
          <div 
            className="leading-relaxed text-ghibli-text"
            dangerouslySetInnerHTML={{ __html: INFO_MESSAGE(years.length, year) }} 
          />
        </div>
      </section>
      <div className="space-y-4">
        {yearsArrayUpdate.map((y) => (
          <YearStat key={y} year={y} onClick={onClick} />
        ))}
      </div>
    </div>
  );
};

export default YearsStat;
