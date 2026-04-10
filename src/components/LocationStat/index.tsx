import YearStat from '@/components/YearStat';
import {
  CHINESE_LOCATION_INFO_MESSAGE_FIRST,
  CHINESE_LOCATION_INFO_MESSAGE_SECOND,
} from '@/utils/const';
import CitiesStat from './CitiesStat';
import LocationSummary from './LocationSummary';
import PeriodStat from './PeriodStat';

interface ILocationStatProps {
  changeYear: (_year: string) => void;
  changeCity: (_city: string) => void;
  changeTitle: (_title: string) => void;
}

const LocationStat = ({
  changeYear,
  changeCity,
  changeTitle,
}: ILocationStatProps) => (
  <div className="w-full pb-8">
    <section className="mb-6">
      <div className="ghibli-card p-4 shadow-sm">
        <p className="leading-relaxed text-ghibli-text">
          {CHINESE_LOCATION_INFO_MESSAGE_FIRST}
          .
          <br />
          {CHINESE_LOCATION_INFO_MESSAGE_SECOND}
          .
          <br />
          <br />
          <span className="text-ghibli-accent italic">Yesterday you said tomorrow.</span>
        </p>
      </div>
    </section>
    <LocationSummary />
    <CitiesStat onClick={changeCity} />
    <PeriodStat onClick={changeTitle} />
    <YearStat year="Total" onClick={changeYear} />
  </div>
);

export default LocationStat;
